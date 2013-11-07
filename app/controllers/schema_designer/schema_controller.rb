require_dependency "schema_designer/application_controller"

module SchemaDesigner
  class SchemaController < ApplicationController
    helper_method :parse_schema
    def index
    end
    
    def save
      new_schema = JSON.parse params[:tables]
      old_schema = parse_schema
      @change = []
      @up = []
      @down = []
      new_schema.each do |table|
        id = table["id"]
        corresponding_table = old_schema.find(&by_id(id))
        if corresponding_table.nil?
          new_table(table)
        else
          old_ids = corresponding_table[:columns].map{|t| t[:id]}
          table["columns"].each do |col|
            if old_ids.include? col["id"]
              unless (old_col = corresponding_table[:columns].find(&by_id(col["id"]))) == col.symbolize_keys
                column_change(table, old_col, col)
              end
              old_ids.delete col["id"]
            else
              new_column(table, col)
            end
          end
          old_ids.each do |id|
            delete_column table, corresponding_table[:columns].find(&by_id(id))
          end
        end
      end
      migration = "class #{params[:name].camelize} < ActiveRecord::Migration\n"
      migration << "\n  def up\n    #{@up.join("\n    ")}\n  end\n"         if @up.length > 0
      migration << "\n  def down\n    #{@down.join("\n    ")}\n  end\n"     if @down.length > 0
      migration << "\n  def change\n    #{@change.join("\n    ")}\n  end\n" if @change.length > 0
      migration << "\nend"
      
      File.write(File.join(Rails.root, 'db', 'migrate', "#{Time.now.to_i}_#{params[:name].underscore}.rb"), migration, mode: 'w')
      
      head :ok
    end
    
  protected
    def by_id(id)
      Proc.new{|t| t[:id] == id || t["id"] == id}
    end
    
    def column_change(table, old, new)
      if old[:type] == new["type"]
        @change << "rename_column :#{table["name"]}, :#{old[:name]}, :#{new["name"]}"
      elsif old[:name] == new["name"]
        @up << "change_column :#{table["name"]}, :#{old[:name]}, :#{new["type"]}"
        @down << "change_column :#{table["name"]}, :#{old[:name]}, :#{old[:type]}"
      else
        raise "not implemented"
      end
    end
    
    def new_column(table, col)
      @change << "add_column :#{table["name"]}, :#{col["name"]}, :#{col["type"]}"
    end
    
    def delete_column(table, col)
      @up << "remove_column :#{table["name"]}, :#{col[:name]}"
      @down << "add_column :#{table["name"]}, :#{col[:name]}, :#{col[:type]}"
    end
  
    def new_table(table)
      opts = table["hasId"] ? "" : ", :id => false"
      code = "create_table :#{table["name"]}#{opts} do |t|\n"
      table["columns"].each do |col|
        if ['primary_key', 'string', 'text', 'integer', 'float', 'decimal', 'datetime', 'timestamp', 'time', 'date', 'binary', 'boolean', 'references'].include? col["type"]
          code << "      t.#{col["type"]} :#{col["name"]}\n"
        else
          code << "      t.column :#{col["name"]}, :#{col["type"]}\n"
        end
      end
      if table["hasTimestamps"]
        code << "      t.timestamps\n"
      end
      code << "    end"
      @change << code
    end
  
    def parse_schema
      path = File.join(Rails.root, 'db', 'schema.rb')
      if File.exist? path
        lines = File.read(path).split(/\n/)
        last_table = nil
        tables = {}
        table_id = 0
        column_id = 0
        lines.each do |line|
          if match = line.match(/^\s*create_table "(.+?)"(.+)/)
            last_table = match[1]
            hasId = !(match[2] =~ /id:\s*false/)
            table_id += 1
            tables[last_table] = {
              id: table_id,
              name: last_table,
              hasId: hasId,
              hasTimestamps: false,
              columns: []
            }
          elsif last_table && (match = line.match(/^\s*t.(\w+?)\s+"(.+?)"(\s*,\s*.+)?/))
            options = match[3]
            if match[2] == 'created_at' || match[2] == 'updated_at'
              tables[last_table][:hasTimestamps] = true
            elsif match[1] == 'integer' && match[2] =~ /^(.+)_id$/
              column_id += 1
              tables[last_table][:columns] << {
                id: column_id,
                name: $1,
                type: 'references'
              }
            else
              column_id += 1
              tables[last_table][:columns] << {
                id: column_id,
                name: match[2],
                type: match[1]
              }
            end
          end
        end
        tables.values
      else
        []
      end
    end
  end
end
