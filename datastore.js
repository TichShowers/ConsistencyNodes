var datacollection = [];

var get = function(id){
	var filtereddata = datacollection.filter(function(element) { return element.id === id })
	return filtereddata[0];
};

var findLastUpdate = function(id){
	var obj = get(id);
	if(obj)
	{
		return obj.history[obj.history.length - 1];
	}
	else
		return null;
}

var add = function(id, data, guid){
	return addWithTimestamp(id, data, guid, Date.now());
};

var addWithTimestamp = function(id, data, guid, timestamp){
	var obj = {
		id : id, 
		history: [{
			data: data, 
			modifiedat: timestamp, 
			modifiedby: guid}]
	};

	datacollection.push(obj);

	return obj;
}

var addOrUpdate = function(id, data, guid){
	var obj = get(id);

	if(obj)
	{
		obj = update(id, data, guid);
	}
	else
	{
		obj = add(id, data, guid);
	}

	return obj;
};

var update = function(id, data, guid){
	var obj = get(id);

	if(!obj)
		return obj;

	obj.history.push({
			"data": data, 
			"modifiedat": Date.now(), 
			"modifiedby": guid});

	return obj;
};

var getAll = function(){
	return datacollection;
};

var cleanHistory = function(timestamp){
	datacollection.forEach(function(element){
		element.history = element.history.filter(function(point) {
			return point.modifiedat > timestamp;
		});
	});
	_sortHistory(id);
};

var merge = function(id, data, guid, timestamp) {
	var obj = get(id);

	if(obj)
	{
		var point = obj.history.filter(function(p) {
			return guid === p.modifiedby && timestamp === p.modifiedat;
		});

		if(point[0])
		{
			// Conflict resolution???
			point[0].data = data;
			point[0].modifiedat = timestamp;
			point[0].modifiedby = guid;

		}	
		else
		{
			obj.history.push({
				"data": data, 
				"modifiedat": timestamp, 
				"modifiedby": guid});
		}
		_sortHistory(id);
	}
	else
	{
		addWithTimestamp(id, data, guid, timestamp);
	}
}

var _sortHistory = function(id) {
	var obj = get(id);

	if(obj)
	{
		obj.history.sort(function(source, target) { return source.modifiedat - target.modifiedat; });
	}
}

var manipulator = function() {
	return {
		add: add,
		getAll: getAll,
		get: get,
		update: update,
		cleanHistory: cleanHistory,
		addOrUpdate: addOrUpdate,
		merge: merge,
		findLastUpdate: findLastUpdate
	};
};

module.exports = manipulator();