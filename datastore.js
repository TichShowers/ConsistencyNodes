var datacollection = [];

var get = function(id) {
	var filtereddata = datacollection.filter(function(element) { return element.id === id })
	return filtereddata[0];
};

var add = function(id, data, guid){
	var obj = {
		id : id, 
		history: [{
			data: data, 
			modifiedat: Date.now(), 
			modifiedby: guid}]
	};

	datacollection.push(obj);

	return obj;
};

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
}

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
}

var manipulator = function() {
	return {
		add: add,
		getAll: getAll,
		get: get,
		update: update,
		cleanHistory: cleanHistory,
		addOrUpdate: addOrUpdate
	};
};

module.exports = manipulator();