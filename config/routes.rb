# SchemaDesigner::Engine.routes.draw do
  #get "schema/index"
# end

Rails.application.routes.draw do
  if Rails.env.development?
    get '/_schema' => "schema_designer/schema#index"
    post '/_schema' => "schema_designer/schema#save"
  end
end