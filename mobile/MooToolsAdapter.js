(function()
{
	Object.merge = $.extend;
	
	// Fake .each
	Array.prototype.each = function( fn, bind )
	{
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) fn.call(bind, this[i], i, this);
		}
	};
		
	//return Array.forEach( this, fn );
	
	var typeOf = this.typeOf = function(item)
	{
		if (item == null) return 'null';
		if (item.$family) return item.$family();

		if (item.nodeName)
		{
			if (item.nodeType == 1) return 'element';
			if (item.nodeType == 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
		}
		else if (typeof item.length == 'number')
		{
			if (item.callee) return 'arguments';
			if ('item' in item) return 'collection';
		}

		return typeof item;
	};
	
	if( typeof JSON == 'undefined' ) this.JSON = {};
	JSON.encode = $.toJSON;
	
}).call( this );



// Fake Request.JSON
var Request = {};
Request.JSON = function( obj ){ this.obj = obj; };
Request.JSON.prototype.post = function( params )
{
	var obj = this.obj;
	
    var ajax = $.ajax
    ({
        url: this.obj.url,
        dataType: 'json',
        data: params,
        type: 'post',
        success: function( json )
        {
			if( obj.onSuccess )
            	obj.onSuccess( json );
        },
        error: function( evt )
        {
			if( obj.onFailure )
            	obj.onFailure( evt );
        }
    });

    return ajax;
};

Request.JSON.prototype.get = function( params )
{
	var obj = this.obj;
	
    var ajax = $.ajax
    ({
        url: this.obj.url,
        dataType: 'json',
        data: params,
        type: 'get',
        success: function( json )
        {
			if( obj.onSuccess )
            	obj.onSuccess( json );
        },
        error: function( evt )
        {
			if( obj.onFailure )
            	obj.onFailure( evt );
        }
    });

    return ajax;
};

