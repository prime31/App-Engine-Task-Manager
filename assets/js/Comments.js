main.comments = {
	projectId: null,
	taskId: null,
	view: null,
	backArrowLink: null,
	spinner: null,
	taskRequest: null,
	
	init: function()
	{
		// listen to a few things so that we can hide ourself if anything gets selected
		main.addEvent( 'selectedProjectChanged', this.hideTaskDetails );
		main.addEvent( 'selectedTagChanged', this.hideTaskDetails );
		
		this.backArrowLink = $( 'main' ).getElement( 'h3.project > a.back' );
		this.backArrowLink.addEvent( 'click', this.hideTaskDetails );
	},
	
	showSpinner: function( shouldShow )
	{
		// lazily create the spinner
		if( main.comments.spinner == null )
			main.comments.spinner = new Spinner( $( 'main' ).getElement( 'div.mooLayoutBottom' ), { hideOnClick: true, maskMargins: true, fxOptions: { duration: 0.1 } } );
		
		if( shouldShow )
			main.comments.spinner.show();
		else
			main.comments.spinner.hide();
	},
	
	hideTaskDetails: function()
	{
		main.tasks.deselectAllTasks();
		
		if( main.comments.view )
		{
			main.comments.backArrowLink.getElement( 'ins' ).addClass( 'hide' );
			main.comments.view.destroy();
			main.comments.view = null;
		}
	},
	
	showTaskDetails: function( taskId, projectId )
	{
		main.comments.showSpinner( true );
		if( main.comments.taskRequest )
			main.comments.taskRequest.cancel();
		
		// dont allow two of these!
		if( main.comments.view )
		{
			main.comments.view.destroy();
			main.comments.view = null;
		}
		
		this.backArrowLink.getElement( 'ins' ).removeClass( 'hide' );
		
		this.projectId = projectId;
		this.taskId = taskId;
		
		// grab the task details
		main.comments.taskRequest = Task.getTask( taskId, projectId, this.taskDetailsLoaded );
	},
	
	taskDetailsLoaded: function( task )
	{
		main.comments.taskRequest = null;
		main.comments.showSpinner( false );
		
		// inject the comments view
		var dim = $( 'main' ).getCoordinates();
		var winSize = window.getSize();

		main.comments.view = new Element( 'div',
		{
		    styles: {
		        height: '100%',
		        backgroundColor: '#fff',
				overflowY: 'auto'
		    }
		});
		
		// grab the template and fill in our values
		var template = document.id( 'commentsPage' ).getFirst().clone();
		
		template.getElement( 'span.task-title').set( 'html', task.title );
		
		// description
		if( task.description.length )
			template.getElement( '.task-notes > p' ).set( 'html', task.description.replace( /\n/g, '<br />' ) );
		else
			template.getElement( '.task-notes' ).destroy();
		
		var tagsList = template.getElement( 'ul.task-tags-list' );
		
		if( task.tags.length > 0 )
		{
			task.tags.each( function( tag )
			{
				var li = Elements.from( '<li class="tag"><a href="#">' + tag + '</a></li>' );
				li[0].inject( tagsList );
			});
		}
		else
		{
			tagsList.destroy();
		}
		
		// add our images
		main.comments.addImages( task.images, template );
		
		// listen for remove button clicks on the images
		template.getElement( 'ul.image-list' ).addEvent( 'click:relay(li a.remove)', function( evt, ele )
		{
			evt.stop();
			
			var li = ele.getParent( 'li' );
			var imageId = li.getAttribute( 'data-id' );
			
			$prompt.show( 'Are you sure you want to remove this image?',
			{
				buttons: { Cancel: false, Remove: true,  },
				callback: function( v, m, f )
				{
					if( v )
					{
						Image.remove( main.comments.projectId, main.comments.taskId, imageId );
						li.destroy();
					}
					return true;
				}
			});
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
			main.comments.injectComment( c, commentsList );
		});
		
		// listen for remove button clicks on the comments
		commentsList.addEvent( 'click:relay(li a.remove)', function( evt, ele )
		{
			evt.stop();
			
			var li = ele.getParent( 'li' );
			var commentId = li.getAttribute( 'data-id' );
			
			$prompt.show( 'Are you sure you want to remove this comment?',
			{
				buttons: { Cancel: false, Remove: true,  },
				callback: function( v, m, f )
				{
					if( v )
					{
						Comment.remove( main.comments.projectId, main.comments.taskId, commentId );
						li.destroy();
					}
					return true;
				}
			});
		});
		
		// listen to click events on the submit button
		template.getElement( 'a.submit' ).addEvent( 'click', function( evt )
		{
			var comment = main.comments.view.getElement( 'textarea.body' ).value;
			if( comment.length == 0 )
				return;

			// add the comment
			Comment.add( main.comments.projectId, main.comments.taskId, comment, function( c )
			{
				// inject the new comment and wipe out the textarea
				main.comments.injectComment( c, commentsList, true );
				main.comments.view.getElement( 'textarea.body' ).value = '';
			});
		});
		
		// injection!
		template.inject( main.comments.view );
		main.comments.view.inject( $( 'main' ).getElement( 'div.mooLayoutBottom' ) );
		
		main.comments.view.scrollTo( 0, 0 );
		
		// setup the textbox expander and the image uploader
		new DynamicTextarea( template.getElement( 'textarea.body' ) );
		main.images.setup( main.comments.projectId, task.id );
	},
	
	injectComment: function( comment, list, highlight )
	{
		// if list is null, just grab the current list
		if( typeOf( list ) != 'element' )
			main.comments.view.list = getElement( 'ul.activities-list' );
		
		var commentTemplate = document.id( 'commentTemplate' ).getChildren()[0].clone();
		commentTemplate.getElement( 'div.header' ).set( 'html', comment.created.timeDiffInWords() );
		commentTemplate.getElement( 'div.content' ).set( 'html', comment.text.replace( /\n/g, '<br />' ) );
		
		// set the id for later use
		commentTemplate.setAttribute( 'data-id', comment.id );
		
		commentTemplate.inject( list );
		
		if( highlight )
			commentTemplate.highlight.delay( 250, commentTemplate );
	},
	
	// images can be an array or single Image
	addImages: function( images, listParentElement, highlight )
	{
		images = Array.from( images );
		
		if( typeOf( listParentElement ) != 'element' )
			listParentElement = main.comments.view;
		
		var list = listParentElement.getElement( 'ul.image-list' );
		images.each( function( i )
		{
			var li = Elements.from( '<li class="tag"><a href="' + i.url + '" target="_blank">' + i.filename + '</a><a class="remove"></a></li>' );
			li[0].setAttribute( 'data-id', i.id );
			li[0].inject( list );
			
			if( highlight )
				li[0].highlight.delay( 250, li[0] );
		});
	}
};

main.images = {
	uploader: null,
	
	setup: function( projectId, taskId )
	{
		// kill any existing uploaders
		if( main.images.uploader )
			main.images.uploader.destroySelf();
		
		var list = main.comments.view.getElement( 'ul.file-list' );
		var buttons = main.comments.view.getElements( 'a.file-attach-button' );
		
		main.images.uploader = new FancyUpload.Attach( list, buttons,
		{
			path: '/assets/Swiff.Uploader.swf',
			url: '/images/add',
			fileSizeMax: 2 * 1024 * 1024,
			verbose: false,
			data: { taskId: taskId, projectId: projectId },
			queued: false,
			instantStart: true,
			//typeFilter: { 'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png' },

			onSelectFail: function( files )
			{
				files.each( function( file )
				{
					new Element( 'li',
					{
						'class': 'file-invalid',
						events: {
							click: function()
							{
								this.destroy();
							}
						}
					}).adopt(
						new Element( 'span', { html: file.validationErrorMessage || file.validationError })
					).inject( this.list, 'bottom' );
				}, this );	
			},

			onFileSuccess: function( file )
			{
				// decode our return into a valid Image or fail
				var res = JSON.decode( file.response.text );
				if( !res.result )
				{
					alert( res.error );
					return;
				}
				
				var image = new Image();
				image.fromJson( res.data );
				main.comments.addImages( image );
				
				file.ui.element.highlight( '#e6efc2' );
			},

			onFileError: function(file)
			{
				file.ui.cancel.set( 'html', 'Retry' ).removeEvents().addEvent( 'click', function()
				{
					file.requeue();
					return false;
				});

				new Element( 'span',
				{
					html: file.errorMessage,
					'class': 'file-error'
				}).inject( file.ui.cancel, 'after' );
			},

			onFileRequeue: function( file )
			{
				file.ui.element.getElement( '.file-error' ).destroy();

				file.ui.cancel.set( 'html', 'Cancel' ).removeEvents().addEvent( 'click', function()
				{
					file.remove();
					return false;
				});

				this.start();
			}

		});
	}
}