# Schema Designer

Schema Designer is a development plugin for Ruby on Rails that visualizes the database and provides a visual tool for authoring migrations. It's purpose is to keep the great time savers the current migration generators have, but also be a tool for working with either complex migrations or editing a schema the developer is not familiar with.

## Usage

Install the gem by adding this to your `gemfile`:

		gem 'schema_designer', group: :development
		
Then run your server as usual. When you navigate to `http://localhost:3000/_schema`, you will be able to access the Schema Designer.

If you use it with an empty application, you will see an empty screen with the command bar at the bottom, otherwise you will see a diagram with the contents of your `schema.rb`. Applications that do not use schema.rb are not currently supported.

## Command Bar

The command bar accepts syntax similar to the migration generator in rails:

		table_name column_name:column_type column_name[:column_type]...
		
The `table_name` will be pluralized automatically. If you ommit the `:column_type`, it will default to `string`. Types should be autocompleted, however you are not limited to the types suggested, you can use any type your database supports. `references` type will create a link to the table of the matching name.

## Roadmap

Schema Designer should be considered as an alpha software, as it still has some basic flaws. However the software is useable and usefull for some applications. Here are some things that currently don't work but are something that I have in mind (contributions welcome):

- Better layout algorithm (#1).
- More solid support for the id and timestamps features (#2).
- Fix autocomplete in table rows (#3).
- Support for automating habtm join tables (#4).
- Fast syntax for editing tables (#5).
