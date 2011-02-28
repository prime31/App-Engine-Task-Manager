prompts = {
	configureTag: function( tag )
	{
		// stick our tag HTML in the config
		prompts.tagConfig.rename.html = 'Please enter the tag name:<br /><input type="text" name="tagName" value="' + tag + '" />';
		$prompt.show( prompts.tagConfig );
		prompts.tagConfig.start.tag = tag;
	},
	
	configureProject: function( project )
	{
		// stick our tag HTML in the config
		prompts.projectConfig.rename.html = 'Please enter the project name:<br /><input type="text" name="projectName" value="' + project.name + '" />';
		$prompt.show( prompts.projectConfig );
		prompts.projectConfig.start.projectId = project.id;
	},
	
	newProjectOrTag: function()
	{
		$prompt.show( prompts.newItemConfig );
	}
}


prompts.tagConfig = {
	start:
	{
		html:'What would you like to do with this tag?',
		buttons: { Delete: 'del', Rename: 'ren' },
		focus: 1,
		submit:function( v, m, f )
		{ 
			if( v == 'del' )
				$prompt.goToState( 'delete' );
			else if( v == 'ren' )
				$prompt.goToState( 'rename' )
				
			return false; 
		}
	},
	delete:
	{
		html:'Are you sure you want to delete this tag?',
		buttons: { Back: 1, Delete: 2 },
		focus: 1,
		submit:function( v, m, f )
		{ 
		    if( v == 0 )
				$prompt.close();
		    else if( v == 1 )
				$prompt.goToState( 'start' );
			else if( v == 2 )
			{
				Tags.remove( prompts.tagConfig.start.tag )
				return true;
			}
				
		    return false;
		}
	},
	rename:
	{
	    html: '',
	    buttons: { Back: 1, Rename: 2 },
	    submit: function( v, m, f )
	    {
	        if( v == 0 )
	            $prompt.close();
	        else if( v == 1 )
	            $prompt.goToState( 'start' );
	        else if( v == 2 )
			{
				Tags.rename( prompts.tagConfig.start.tag, f.tagName );
				return true;
			}
	
	        return false;
	    } 
	}
};

prompts.projectConfig = {
	start:
	{
		html:'What would you like to do with this project?',
		buttons: { Delete: 'del', Rename: 'ren' },
		focus: 1,
		submit:function( v, m, f )
		{ 
			if( v == 'del' )
				$prompt.goToState( 'delete' );
			else if( v == 'ren' )
				$prompt.goToState( 'rename' )
				
			return false; 
		}
	},
	delete:
	{
		html:'Are you sure you want to delete this project?',
		buttons: { Back: 1, Delete: 2 },
		focus: 1,
		submit:function( v, m, f )
		{ 
		    if( v == 0 )
				$prompt.close();
		    else if( v == 1 )
				$prompt.goToState( 'start' );
			else if( v == 2 )
			{
				Project.remove( prompts.projectConfig.start.projectId )
				return true;
			}
				
		    return false;
		}
	},
	rename:
	{
	    html: '',
	    buttons: { Back: 1, Rename: 2 },
	    submit: function( v, m, f )
	    {
	        if( v == 0 )
	            $prompt.close();
	        else if( v == 1 )
	            $prompt.goToState( 'start' );
	        else if( v == 2 )
			{
				Project.rename( prompts.projectConfig.start.projectId, f.projectName );
				return true;
			}
	
	        return false;
	    } 
	}
};

prompts.newItemConfig = {
	start:
	{
		html: 'Would you like to create a new project or tag?',
		buttons: { Project: 'p', Tag: 't' },
		focus: 1,
		submit: function( v, m, f )
		{ 
			if( v == 'p' )
				$prompt.goToState( 'project' );
			else if( v == 't' )
				$prompt.goToState( 'tag' );

			return false; 
		}
	},
	project:
	{
		html: 'Please enter the project name:<br /><input type="text" name="projectName" value="" />',
		buttons: { Back: 0, Add: 1 },
		focus: 1,
		submit: function( v, m, f )
		{
			if( v == 0 )
			{
				$prompt.goToState( 'start' );
				return false;
			}
		    else if( v == 1 )
			{
				if( f.projectName.length == 0 )
					return false;
				
				Project.add( f.projectName, function( p ){});
			}
				
		    return true;
		}
	},
	tag:
	{
		html: 'Please enter the tag name:<br /><input type="text" name="name" value="" />',
		buttons: { Back: 0, Add: 1 },
		focus: 1,
		submit: function( v, m, f )
		{
			if( v == 0 )
			{
				$prompt.goToState( 'start' );
				return false;
			}
		    else if( v == 1 )
			{
				if( f.name.length == 0 )
					return false;
				

				Tags.add( f.name );
			}
				
		    return true;
		}
	}
};
