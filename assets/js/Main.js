var Main = new Class({
	
	Implements: Events,
	
	projectSortable: null,
	tagSortable: null,
	mooLayout: null,
	
	init: function()
	{
		// handle layout
		window.addEvent( 'resize', main.layout );
		
		// init our parts
		main.projects.init();
		main.tags.init();
		main.tasks.init();
		main.pop.init();
		main.comments.init();
		
		// load some projects and tags
		Project.loadProjects( this.projectsLoaded, this.projectLoadFailed );
		
		$prompt.defaults.prefix = 'jqismooth';
		
		// listen to clicks on the add button in the west toolbar
		$( 'west' ).getElement( 'div.new-action > a' ).addEvent( 'click', prompts.newProjectOrTag );
		
		this.mooLayout = new MooLayout( 'mooLayoutContent' );
		this.mooLayout.addEvent( 'resize', this.layoutChanged );
	},
	
	layout: function()
	{
		var winSize = window.getSize();
		$( 'main' ).setStyle( 'width', winSize.x - 211 );
		
		// update the tagList
		var tagList = $( 'tagListWrapper' );
		var newHeight = winSize.y - tagList.getCoordinates().top - 30 + 10; // bottom toolbar(30), ul padding(10)
		tagList.setStyle( 'height', newHeight );
		
		// the whole west column needs an update
		$( 'west' ).setStyle( 'height', winSize.y - 42 );
	},
	
	// this gets called whenever the MooLayout resizes so that the list wrapper
	layoutChanged: function()
	{
		// we grab the MooLayout window size and subtract our gray header bar
		$( 'taskListWrapper' ).setStyle( 'height', main.mooLayout.windows[0].getSize().y - 24 );
	},
	
	alert: function( message, title )
	{
		title = title || 'Prime31 Tasks';
		
		if( main.tinyAlert == undefined )
			main.tinyAlert = new TinyAlert({ position: 'br' });
		main.tinyAlert.show( title, message )
	},
	
	projectsLoaded: function( projects, tags )
	{
		main.tags.clearTags();
		main.tags.addTags( tags );
		
		main.projects.clearProjects()
		main.projects.addProjects( projects );
	},
	
	projectLoadFailed: function( xhr )
	{
		alert( 'Project load failed' );
	},

	deselectProjectAndTag: function()
	{
		var ele = document.id( 'projectList' ).getElement( 'li.selected' );
		if( ele )
			ele.removeClass( 'selected' );
			
		var ele = document.id( 'tagList' ).getElement( 'li.selected' );
		if( ele )
			ele.removeClass( 'selected' );
	},
	
	setTitle: function( title )
	{
		$$( 'title' )[0].innerHTML = title;
	}

});

var main = new Main();

document.addEvent( 'domready', main.init.bind( main ) );