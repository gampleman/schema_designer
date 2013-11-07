Rails.application.routes.draw do

  mount SchemaDesigner::Engine => "/schema_designer"
end
