$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "schema_designer/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "schema_designer"
  s.version     = SchemaDesigner::VERSION
  s.authors     = ["Jakub Hampl"]
  s.email       = ["honitom@seznam.cz"]
  s.homepage    = "http://code.gampleman.eu/schema_designer"
  s.summary     = "Visual aid for making migrations."
  s.description = "Create active recode migrations through a visual database tool that is based on Rails conventions."

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "~> 4.0.0"

  s.add_development_dependency "sqlite3"
end
