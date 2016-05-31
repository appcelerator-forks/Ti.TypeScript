# Ti.TypeScript

[Titanium](http://www.appcelerator.com) is a great platform for writing cross-platform mobile apps using Javascript.

[TypeScript](https://www.typescriptlang.org/) is a language built on top of Javascript to empower it with missing features and bring ES6/7 power to it and more, and transpiles back to ES5.

I decided to search for a solution to write Titanium applications with TypeScript because (1) I like it very much. It brings a lot of order and convenience to Javascript development. And (2) Titanium currently only support ES5 (accourding to a response to a [tweet](https://twitter.com/SupervillDev82/status/733661371754242048) of mine - ES6 support is comming - yet still TypeScript is still much more). (3) I like TypeScript transpiler result better than I do Babel transpiler result - in my opinion it's closer to a code I would write myself and cleaner without much overhead.

...

#### How it works

I've based my solution to transpile to TypeScript on an article I found [here](http://www.tidev.io/2015/10/28/titanium-alloy-and-es6/) (http://www.tidev.io/2015/10/28/titanium-alloy-and-es6/) when I was initialiy looking for a solution to work with ES6. This article is a bit old, so I had to find how to work around all had changed since it was written.

...

#### Current Limitations

 * NO DEBUGGING - If you try to debug, what you would be debugging is your transpiled code from TypeScript to ES5 - so it will make it difficult to discover bugs. This might be fixable with mapfiles - but I still have to look more into it.
 * A minimum requirement of an Alloy project is to have the `app/controllers/index.js` files, so you cannot change this file extention to `.ts` file (but you can write TypeScript code inside it). 
 * This script is currently for MAC OS X only (might work on Linux but definitely not Windows) - I will try to update the script in the future so keep track. 

...
#### Let the hacking begin...

###### Hacking Titanium SDK

 1. Hacking Alloy compiler script:
    
    Open `/Users/YOUR_USERNAME/.appcelerator/install/SDK_VERSION/package/node_modules/alloy/Alloy/commands/compile/index.js` with your favorite editor (note to change YOUR_USERNAME to your username and SDK_VERSION to the version of the SDK you write your project in).
    
 2. Find the module export. It should look like this:
    
    ```
    //////////////////////////////////////
    ////////// command function //////////
    //////////////////////////////////////
    module.exports = function(args, program)
    ```
    
    
 3. After the variables decleration (which will include a variable named `path`) add the following lines:
    ```
    // TypeScript Hack
	try {
		var tsAppPath = path.join(paths.project, '.app');
		var tsConfigFile = path.join(paths.project, 'app') + '/tsconfig.json';
		
		fs.accessSync(tsAppPath, fs.F_OK);
		fs.accessSync(tsConfigFile, fs.F_OK);
		
		paths.app = tsAppPath;
		logger.info('Found TypeScript hack');
	}
	catch (ex) {
		logger.info('Just another ES5 project');
	}
    ```
    
    What we do here is to check if the project we're currently running contains a hidden `.app` folder and a TypeString configuration file (both will be created in further steps). If we find those files then we set a variable to hold the hidden folder path for later use.
    
    When you run your app, in console you should see the logger prints `Found TypeScript hack` for TypeScript projects and `Just another ES5 project` for all other projects (supporting all our "old" projects).
    

 4. In the same file, further down the code you will find the following line:
  
     `widgetDirs.push({ dir: path.join(paths.project,CONST.ALLOY_DIR) });`
     
     Comment it so it would look something like this:

     `//widgetDirs.push({ dir: path.join(paths.project,CONST.ALLOY_DIR) }); //<<-- commented for TypeScript hack below`
     
     And right below that line add the following code:
     
     ```
     // TypeScript Hack
	 if (paths.app) {
	 	 widgetDirs.push({ dir: paths.app });
	 }
	 else {
		 widgetDirs.push({ dir: path.join(paths.project,CONST.ALLOY_DIR) });
	 }
     ```
     
     What we do here is to check if the `paths.app` variable that we've set at the top is present and if so we tell the Alloy compiler to look for code inside the `.app` folder, otherwise we leave everything just the way it was to support none TypeScript projects.
     
We're done hacking the Titanium SDK. Notice that you will have to repeat these steps if you upgrade to a newer SDK version in the future. Now lets set up our project to support TypeScript.

###### Setting up TypeScript support for our project

  1. From terminal, CD to you project directory and then create the `.app` folder:
     ```
     cd MY_PROJECT
     mkdir .app
     ```
     
  2. Create an empty `alloy.jmk` file:
     ```
     touch .app/alloy.jmk
     ```
    
  3. Open `.app/alloy.jmk` with your favorite text editor and paste the following code and save:
     ```
     task("pre:compile", function (e, log) {
         var fs = require('fs'),
             path = require('path'),
             exec = require('child_process').execSync;

	     var endsWith = function(str, suffix) {
	         return str.indexOf(suffix, str.length - suffix.length) !== -1;
	     };
	
         var scrRoot = e.dir.home.replace('/.app', '/app');
 
         // TypeScript everything
         if (endsWith(e.dir.home, '.app')) {
             log.info("TypeScript transpiler started");
        
             // First of all, erase previous compilation but alloy.jmk (this file)
             exec('find ' + e.dir.home +
                  ' ! -name "alloy.jmk"' +
                  ' -type f -delete');
        
             // And copy the current app into the future app folder for Alloy
             exec("rsync -avr --exclude='tsconfig.json' --exclude='alloy.jmk' " + scrRoot + "/* " + e.dir.home);
        
             // Remove TypeScript files
             exec('find ' + e.dir.home + ' -name "*.ts" -delete');

             // And finally, transcompile with TypeScript
             try {
                 exec('tsc --allowJs -p ' + scrRoot + ' --outDir ' + e.dir.home);
             }
             catch(e) {
                 log.warn(e);
             }
        
             log.info("TypeScript transpiler completed!");
         }
     });
     ```

     This file is where all the magic happens. Our SDK hack above causes the Alloy compiler to belive that our sources are inside the `.app` folder, but we actually keep working as we're used to in the `app` folder. This script will make sure to copy all out resources and run the TypeScript compiler (you can write your TypeScript code in `.ts` files - but you can also keep working with regular `.js` files as I instructed the compiler to proccess `.js` files).
     
     Read my comments in the above script to learn more what each step does. And if you want to learn more about the `alloy.jdk` file you can read [this](http://docs.appcelerator.com/platform/latest/#!/guide/Build_Configuration_File_(alloy.jmk))     
http://docs.appcelerator.com/platform/latest/#!/guide/Build_Configuration_File_(alloy.jmk)

  4. In your `app` directory, create 2 more files:
   ```
   touch app/alloy.jmk
   touch app/tsconfig.json
   ```
   
   The first (`alloy.jmk`) will be to show a friendly error message if the SDK we're compiling with doesn't have our hack applied. And the second (`tsconfig.json`) if TypeScript's configuration file.

  5. Paste the following inside `app/alloy.jmk`:
   ```
   task("pre:compile", function (e, log) {
       log.info("Checking for TypeScript hack support in SDK...");
    
       var fs = require('fs'),
           path = require('path');

	   var endsWith = function(str, suffix) {
	       return str.indexOf(suffix, str.length - suffix.length) !== -1;
	   };
	
       if (endsWith(e.dir.home, '/app')) {
          	var foundTsConfig = false;
    	   try {
    		   var tsConfig = e.dir.home.replace('/app', '/app/tsconfig.json');
    		   fs.accessSync(tsConfig, fs.F_OK);
    		   foundTsConfig = true;
    	   }
    	   catch (e) {}
    	
    	   if (foundTsConfig) {
    		   var msg = 'This project requires the TypeScript hack in Titnaium SDK';
    		   log.error(msg);
    		   throw msg;
    	   }
       }
   });
   ```

  6. Paste the following inside `app/tsconfig.json`:
   ```
   {
   	"compileOnSave": false,
        "compilerOptions": {
            "module": "commonjs",
            "target": "es5",
            "noImplicitAny": false,
            "sourceMap": false
        },
        "exclude": [
            "node_modules"
        ]
   }
   ```
   
   You can learn more about TypeScript configuration file [here](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) https://www.typescriptlang.org/docs/handbook/tsconfig-json.htm

...

At this point you're pretty much done. You should now be able to write TypeScript in your Titanium Alloy project.
