stringToColour = (str, alpha) ->
	i = 0
	hash = 0
	while i < str.length
	  hash = str.charCodeAt(i++) + ((hash << 5) - hash)
	i = 0
	colour = "rgba("
	while i < 3
	  colour += ((hash >> i++ * 8) & 0xFF) + ", "
	colour + alpha + ')'

window.Schema = {}

class Schema.Table extends Backbone.Model
	defaults:
		name: ""
		hasId: true
		hasTimestamps: true
		columns: []

class Schema.TableCollection extends Backbone.Collection
	model: Schema.Table
	
class Schema.TablesView extends Backbone.View
	render: ->
		@collection.each (model) ->
			view = new Schema.TableView({model})
			
	


