var site = {
	ulMarkup: '<ul data-role="listview" data-inset="false" data-theme="c" data-dividertheme="b" data-filter="true"></ul>',
	projectLI: '<li><a href="#tasks">TITLE</a></li>',
	taskLI: '<li><h3><a href="#taskDetails">TITLE</a></h3><p>DESCRIPTION</p><a href="#" data-rel="dialog" data-transition="slideup" data-icon="check"></a></li>',
	
	tags: null,
	project: null,
	task: null,
	
	// empties the div and recreates the list
	prepContentForList: function( page )
	{
		var content = page.children( 'div[data-role=content]' ).empty();
		var ul = $( site.ulMarkup );
		content.append( ul );
	},
	
	init: function()
	{
		// Project links
		$( '#projects ul li a' ).live( 'click', function( evt )
		{
			evt.preventDefault();
			
			site.project = $( evt.target ).parents( 'li' ).data( 'project' );
			site.loadTasks();
		});
		
		// add project
		$( '#projectSubmitButton' ).click( function( evt )
		{
			var name = $( '#newProject input' ).val();
			
			Project.add( name, function( project )
			{
				$( '#newProject input' ).val( '' );
				$( '#newProject' ).dialog( 'close' );
				site.loadProjects();
			});
		});
		
		// Task list
		$( '#tasks ul li a' ).live( 'click', function( evt )
		{
			evt.preventDefault();
			
			site.task = $( evt.target ).parents( 'li' ).data( 'task' );
			site.loadComments();
		});
		
		// add task
		$( '#taskSubmitButton' ).click( function( evt )
		{
			var title = $( '#newTask input' ).val();
			var description = $( '#newTask textarea' ).val();
			
			Task.addNew( site.project.id, title, description, [], function( task )
			{
				$( '#newTask textarea' ).val( '' );
				$( '#newTask' ).dialog( 'close' );
				site.loadTasks();
			});
		});
		
		// Check-task buttons
		$( '#tasks ul li a[data-icon=check]' ).live( 'click', function( evt )
		{
			var li = $( evt.target ).parents( 'li' );
			var task = li.data( 'task' );
			
			Task.markComplete( task.id, site.project.id, '1' );
			li.remove();
		});

		// add comment
		$( '#commentSubmitButton' ).click( function( evt )
		{
			var comment = $( '#newComment textarea' ).val();
			
			Comment.add( site.project.id, site.task.id, comment, function( comment )
			{
				$( '#newComment textarea' ).val( '' );
				$( '#newComment' ).dialog( 'close' );
				site.loadComments();
			});
		});
		
		// start loading up the projects
		site.loadProjects();
	},
	
	loadProjects: function()
	{
		$.mobile.pageLoading();
		site.prepContentForList( $( '#projects' ) );
		
		// get the projects from the server
		Project.loadProjects( site.projectsLoaded, site.projectLoadFailed );
	},

	projectsLoaded: function( projects, tags )
	{
		site.tags = tags;
		
		$.each( projects, function( i, p )
		{
			var html = site.projectLI.replace( 'TITLE', p.name );
			var li = $( html );
			li.data( 'project', p );
			li.appendTo( '#projects ul' );
		});
		
		$( '#projects ul' ).listview();
		$.mobile.pageLoading( true );
	},
	
	projectLoadFailed: function( xhr )
	{
		$.mobile.pageLoading( true );
		alert( 'Project load failed' );
	},
	
	loadTasks: function()
	{
		$.mobile.pageLoading();
		site.prepContentForList( $( '#tasks' ) );
		
		Task.getTasksForProjectIdOrTag( site.project.id, site.tasksLoaded, site.taskLoadFailed );	
	},
	
	// request event handlers
	tasksLoaded: function( tasks )
	{
		$.each( tasks, function( i, task )
		{
			var html = site.taskLI.replace( 'TITLE', task.title ).replace( 'DESCRIPTION', task.title );
			var li = $( html );
			li.data( 'task', task );
			li.appendTo( '#tasks ul' );
		});
		
		$( '#tasks ul' ).listview();
		$.mobile.pageLoading( true );
	},
	
	taskLoadFailed: function( xhr )
	{
		$.mobile.pageLoading( true );
		alert( 'Task load failed' );
	},
	
	loadComments: function()
	{
		$.mobile.pageLoading();
		site.prepContentForList( $( '#taskDetails' ) );

		// get the comments from the server
		Task.getTask( site.task.id, site.project.id, function( task )
		{
			// Add a divider with our task name and description
			$( '<li data-role="list-divider">' + site.task.title + '</li>' ).appendTo( '#taskDetails ul' );
			$( '<li>' + site.task.description + '</li>' ).appendTo( '#taskDetails ul' );
			$( '<li data-role="list-divider">Comments</li>' ).appendTo( '#taskDetails ul' );
			
			$.each( task.comments, function( i, c )
			{
				var li = $( '<li>' + c.text + '</li>' );
				li.data( 'comment', c );
				li.appendTo( '#taskDetails ul' );
			});

			$( '#taskDetails ul' ).listview();
			$.mobile.pageLoading( true );
		});
	}

}

$( function()
{
	// kill the damn hash loads before we even begin
	if( window.location.href.indexOf( '#' ) > 0 )
	{
		window.location.href = window.location.href.substring( 0, window.location.href.indexOf( '#' ) );
		return;
	}

	site.init();
});


// Fake alert
var main = {};
main.alert = function( text ) {};

