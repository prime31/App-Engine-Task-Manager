main.comments = {
	projectId: null,
	taskId: null,
	view: null,
	backArrowLink: null,
	
	init: function()
	{
		// listen to a few things so that we can hide ourself if anything gets selected
		main.addEvent( 'selectedProjectChanged', this.hideTaskDetails );
		main.addEvent( 'selectedTagChanged', this.hideTaskDetails );
		
		this.backArrowLink = $( 'main' ).getElement( 'h3.project > a.back' );
		this.backArrowLink.addEvent( 'click', this.hideTaskDetails );
	},
	
	hideTaskDetails: function()
	{
		if( main.comments.view )
		{
			main.comments.backArrowLink.getElement( 'ins' ).addClass( 'hide' );
			main.comments.view.destroy();
			main.comments.view = null;
		}
	},
	
	showTaskDetails: function( taskId, projectId )
	{
		this.backArrowLink.getElement( 'ins' ).removeClass( 'hide' );
		
		this.projectId = projectId;
		this.taskId = taskId;
		
		// grab the task details
		Task.getTask( taskId, projectId, this.taskDetailsLoaded );
	},
	
	taskDetailsLoaded: function( task )
	{
		// inject the comments view
		var dim = $( 'main' ).getCoordinates();
		var winSize = window.getSize();

		main.comments.view = new Element( 'div',
		{
		    styles: {
		        zIndex: 5,
		        position: 'absolute',
		        top: dim.top + 23,
		        left: dim.left,
		        width: dim.width,
		        height: winSize.y - dim.top - 23, // window - top - grey header bar
		        backgroundColor: '#fff',
				overflowY: 'auto'
		    }
		});
		
		// grab the template and fill in our values
		var template = document.id( 'commentsPage' ).getChildren()[0].clone();
		
		template.getElement( 'span.task-title').set( 'html', task.title );
		
		// description
		if( task.description.length )
			template.getElement( '.task-notes > p' ).set( 'html', task.description );
		else
			template.getElement( '.task-notes' ).destroy();
		
		var tagsList = template.getElement( 'ul.task-tags-list' );
		task.tags.each( function( tag )
		{
			var li = Elements.from( '<li class="tag"><a href="#">' + tag + '</a></li>' );
			li[0].inject( tagsList );
		});
		
		// listen for tag clicks
		tagsList.addEvent( 'click:relay(li)', function( evt, ele )
		{
			evt.stop();
			var tag = ele.getElement( 'a' ).get( 'html' );
			
			// trigger some events
			main.tasks.onTagChanged( tag );
			main.deselectProjectAndTag();
			main.comments.hideTaskDetails();
		});
		
		// comments
		var commentsList = template.getElement( 'ul.activities-list' );
		task.comments.each( function( c )
		{
			var commentTemplate = document.id( 'commentTemplate' ).getChildren()[0].clone();
			commentTemplate.getElement( 'div.header' ).set( 'html', c.created );
			commentTemplate.getElement( 'div.content' ).set( 'html', c.text );
			
			commentTemplate.inject( commentsList );
		});
		
		// injection!
		template.inject( main.comments.view );
		main.comments.view.inject( document.body );
		
		main.comments.view.scrollTo( 0, 0 );
	},
	
	addComment: function( text )
	{
		Comment.add( projectId, taskId, text, function( comment )
		{
		    console.log( comment )
		});	
	}
	
};