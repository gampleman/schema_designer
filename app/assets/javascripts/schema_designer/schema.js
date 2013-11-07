function stringToColour(str, alpha) {
	for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
	for (var i = 0, colour = "rgba("; i < 3; colour += ((hash >> i++ * 8) & 0xFF) + ', ');
	return colour + alpha + ')';
}
$(function() {
	
	function makeAutcompletable($el, tabDisabled) {
		$el.autocomplete({
				lookup: ['primary_key', 'string', 'text', 'integer', 'float', 'decimal', 'datetime', 'timestamp', 'time', 'date', 'binary', 'boolean', 'references'],
				delimiter: /:/,
				autoSelectFirst: true,
				tabDisabled: tabDisabled
			});
	}
	makeAutcompletable($('#bar input[type=text]'), true);
	
	var Tables = [];
	$('#bar form').submit(function() {
		var text = $('#bar form input[type=text]').val(),
		vals = text.split(/\s+/),
		table_name = vals.shift();
		if (table_name[table_name.length - 1] !== 's') {
			table_name += 's';
		}
		table = {
			id: 1000 + Math.random() * 1000,
			name: table_name,
			hasId: true,
			hasTimestamps: true,
			columns: vals.map(function(val) { 
			_ref = val.split(':');
			return {name: _ref[0], type: (_ref[1] || "string"), id: (1000 + Math.random() * 1000)};
		})
		};
		
		addTable(table);
		this.reset();
		return false;
	});
	
	$('#output').click(function() {
		var name = prompt("Write a descriptive name").split(/\s+/).map(function(word) {
			return word[0].toUpperCase() + word.slice(1).toLowerCase();
		}).join('');
		$.post('/_schema', {tables: JSON.stringify(Tables), name: name}, function() {
			INITIAL_DATA = Tables;
			alert("Saved.")
		});
		return false;
	});
	
	function updateColumns($table, name) {
		for (var i = 0; i < Tables.length; i++) {
			if (Tables[i].name === name) {
				cols = $table.find('tr:gt(1):not(:last-child)').map(function(i, row) {
					inputs = $(row).find("input");
					var name = inputs.first().val(), type = inputs.last().val();
					return {name: name, type: type, id: $(row).data('id')};
				});
				Tables[i].columns = cols.toArray();
			}
		}
		recalculateEdges();
	}
	
	function addRow(c, $table, table) {
		var style = '';
		if (c.type === 'references') {
			style = " style='background: "+stringToColour(c.name + 's', 0.5)+"'"
		}
		var $source = $("<tr"+style+" data-id='"+c.id+"'><td><input type=text placeholder='Column name' value='" + c.name + "' name=name /></td><td><input type=text value='"+c.type+"' name=type placeholder='Type' /></td><td><button>x</button></tr>");
		$source.find('input[type=text]').change(function() {
			updateColumns($(this).parents('table'), table.name);
		});
		$source.find('button').click(function() {
			$table = $(this).parents('table');
			$(this).parents('tr').remove();
			updateColumns($table, table.name);
		})
		makeAutcompletable($source.find('input[name=type]'), false);
		$table.find('tr:last-child').before($source);
	}
	
	
	function addTable(table) {
		Tables.push(table);
		store[table.name] = graph.newNode({label: table.name});
		recalculateEdges();
		source = "<table id='table-" + table.name + "'><tr><th  style='background: "+stringToColour(table.name, 0.8)+"' colspan=3>" + table.name + "</th></tr>" +
		"<tr><td><label><input type=checkbox name=hasId " + (table.hasId ? 'checked' : '') + " />Primary key</label></td>" +
		"<td><label><input type=checkbox name=hasTimestamps "+ (table.hasTimestamps ? 'checked' : '') + " />Timestamps</label></td><td> </td></tr>" +
		"<tr><td colspan=3><a href='#'>Add row</a></td></tr></table>";
		var $source = $(source);
		table.columns.forEach(function(column) {addRow(column, $source, table)})
		$source.find('input[type=checkbox]').change(function() {
			for (var i = 0; i < Tables.length; i++) {
				if (Tables[i].name === table.name) {
					Tables[i][this.name] = this.checked;
				}
			}
		});
		$source.find('a').click(function() {
			addRow({name: '', type: '', id: 1000 + Math.random() * 1000}, $source, table);
		});
		$('#chart').append($source);
	}
	
	//var INITIAL_DATA ||= [];
	
	
	
	
	// Graph handling
  // --------------
	
	var graph = new Springy.Graph(), 
	layout = new Springy.Layout.ForceDirected(graph, 400, 400.0, 0.5), 
	renderer, 
	store = {},
	currentBB = layout.getBoundingBox(),
	targetBB = {bottomleft: new Springy.Vector(-2, -2), topright: new Springy.Vector(2, 2)};
	
	function recalculateEdges() {
		Tables.forEach(function(t) {
			t.columns.forEach(function(c) {
				if (c.type === "references" && store[c.name + 's']) {
					if (graph.getEdges(store[t.name], store[c.name + 's']).length == 0) {
						graph.newEdge(store[t.name], store[c.name + 's'], {colour: stringToColour(c.name + 's', 1)});
					}
				}
			});
		});
	}
	Springy.requestAnimationFrame(function adjust() {
		targetBB = layout.getBoundingBox();
		// current gets 20% closer to target every iteration
		currentBB = {
			bottomleft: currentBB.bottomleft.add( targetBB.bottomleft.subtract(currentBB.bottomleft)
				.divide(10)),
			topright: currentBB.topright.add( targetBB.topright.subtract(currentBB.topright)
				.divide(10))
		};

		Springy.requestAnimationFrame(adjust);
	});
	var toScreen = function(p) {
		var size = currentBB.topright.subtract(currentBB.bottomleft);
		var sx = p.subtract(currentBB.bottomleft).divide(size.x).x * ($(window).width() - 200);
		var sy = p.subtract(currentBB.bottomleft).divide(size.y).y * ($(window).height() - 200);
		return new Springy.Vector(sx, sy);
	};
	renderer = new Springy.Renderer(layout,
		function clear() {
			// code to clear screen
		},
		function drawEdge(edge, p1, p2) {
			var path;
			if (!edge.path) {
				var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
				path.setAttribute('stroke-width', "2");
				path.setAttribute('fill', 'none');
				path.setAttribute('stroke', edge.data.colour);
				edge.path = path;
				$("svg").append(path);
			}
			p1 = toScreen(p1), p2 = toScreen(p2);
			var r = Math.round;
			
			edge.path.setAttribute('d', "M"+r(p1.x) + " " + r(p1.y) + " L " + r(p2.x) + " " + r(p2.y));
		}, 
		function drawNode(node, p) {
			p = toScreen(p);
			//console.log(node.data.label, p.x, p.y, $("#table-" + node.data.label));
			$("#table-" + node.data.label).css({top: p.y, left: p.x});
		});
		renderer.start()
	
	
	INITIAL_DATA.forEach(addTable);
});