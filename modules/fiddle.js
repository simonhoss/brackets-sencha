/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    'use strict';
    var ProjectManager     = brackets.getModule('project/ProjectManager'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        FileUtils          = brackets.getModule('file/FileUtils'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        Menus              = brackets.getModule('command/Menus'),
        Dialogs            = brackets.getModule('widgets/Dialogs'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        baseURL            = 'https://fiddle.sencha.com/#fiddle/',
        sdks;
    
    function init(config) {
        sdks = {
            // ext js
            '5.1.0': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/5.1.0',
                label   : 'Ext JS 5.1.0'
            },
            '5.0.1': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/5.0.1',
                label   : 'Ext JS 5.0.1'
            },
            '5.0.0': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/5.0.0',
                label   : 'Ext JS 5.0.0'
            },
            'ext-5.0.0.736': {
                remote  : 'https://extjs.cachefly.net/ext/beta/ext-5.0.0.736',
                label   : 'Ext JS 5.0.0.736'
            },
            '4.2.1': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/4.2.1',
                label   : 'Ext JS 4.2.1'
            },
            '4.2.0': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/4.2.0',
                label   : 'Ext JS 4.2.0'
            },
            'ext-4.1.1-gpl': {
                remote  : 'https://extjs.cachefly.net/ext-4.1.1-gpl',
                label   : 'Ext JS 4.1.1'
            },
            'ext-4.1.0-gpl': {
                remote  : 'https://extjs.cachefly.net/ext-4.1.0-gpl',
                label   : 'Ext JS 4.1.0'
            },
            'ext-4.0.7-gpl': {
                remote  : 'https://extjs.cachefly.net/ext-4.0.7-gpl',
                label   : 'Ext JS 4.0.7'
            },
            '3.4.1.1': {
                remote  : 'https://extjs.cachefly.net/ext/gpl/3.4.1.1',
                label   : 'Ext JS 3.4.1.1'
            },
            'ext-3.4.0': {
                remote  : 'https://extjs.cachefly.net/ext-3.4.0',
                label   : 'Ext JS 3.4.0'
            },
            'ext-3.3.0': {
                remote  : 'https://extjs.cachefly.net/ext-3.3.0',
                label   : 'Ext JS 3.3.0'
            },
            'ext-3.0.0': {
                remote  : 'https://extjs.cachefly.net/ext-3.0.0',
                label   : 'Ext JS 3.0.0'
            },
            'ext-2.3.0': {
                remote  : 'https://extjs.cachefly.net/ext-2.3.0',
                label   : 'Ext JS 2.3.0'
            },
            // touch
            'touch-2.4.1': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.4.1',
                label   : 'Sencha Touch 2.4.1'
            },
            'touch-2.4.0': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.4.0',
                label   : 'Sencha Touch 2.4.0'
            },
            'touch-2.3.0': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.3.0',
                label   : 'Sencha Touch 2.3.0'
            },
            'touch-2.2.1': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.2.1',
                label   : 'Sencha Touch 2.2.1'
            },
            'touch-2.2.0': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.2.0',
                label   : 'Sencha Touch 2.2.0'
            },
            'touch-2.1.1': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.1.1',
                label   : 'Sencha Touch 2.1.1'
            },
            'touch-2.0.1.1': {
                remote  : 'https://extjs.cachefly.net/touch/sencha-touch-2.0.1.1',
                label   : 'Sencha Touch 2.0.1.1'
            }
        };
        
        config.MenuManager.addMenus([
            {
                name     : 'sencha.fiddle.download',
                label    : 'Download a Fiddle',
                menu     : [
                    'PROJECT_MENU'
                ],
                fn       : function() {
                    var item = ProjectManager.getSelectedItem(),
                        path = item ? item.fullPath : ProjectManager.getProjectRoot().fullPath;
                    FileSystem.resolve(path, function(error, entry, stats) {
                        // if there's an error or the target path is a file, show error
                        if (error || (entry && entry._isFile)) {
                            alert('Fiddle download location *must* be a folder');
                        } else {
                            _getFiddleURL( path );
                        }
                    });
                }
            }
        ]);
    }
    
    /**
     * @private
     * Validates the input from the user to ensure it's
     * either a fiddle url or a fiddle id
     */
    function _validateFiddleURL() {
        var isValid = false,
            url = $('.fiddle-url').val(),
            shortRegex = /^[a-z0-9]{3}$/,
            urlRegex = /https:\/\/fiddle.sencha.com\/\#fiddle\/[a-z0-9]{3}$/i,
            sdkPath = $('.sdk-path').val();
        // can be fiddle id or full url
        if( (shortRegex.test(url) || urlRegex.test(url)) && sdkPath.length ) {
            isValid = true;
        }
        return isValid;
    }
    
    /**
     * @private
     * Special handler for fiddle form path selector
     * @param {Event} e The button click event
     */
    function _selectPathForField(e) {
        e.preventDefault();
        var $sdkpathField = $('.sdk-path'),
            callback = function(error, dirs) {
                if (!error && dirs.length > 0) {
                    var dir = dirs.pop();
                    $sdkpathField.val(dir).change();
                }
            };
        _showPathSelector('Select SDK Path', callback);       
    }
    
    /**
     * @private
     * Toggles download button state based on validity of form
     * @param {Event} e The event which triggers this handler
     */
    function _toggleFiddleDownloadButton(e) {
        var isValid = _validateFiddleURL(),
            $downloadButton = $('.download-button');
        // toggle button disabled state
        if(isValid) {
            $downloadButton.prop("disabled",false);
        }
        else {
            $downloadButton.prop("disabled",true);
        }
    }
    
    /**
     * @private
     * Entry point for downloading fiddle. Displays modal for user to
     * enter fiddle url or id
     * @param {String} path The path clicked from the context menu
     */
    function _getFiddleURL(path) {
        var modalTemplate = require('text!templates/fiddle/downloadModal.html'),
            renderedTemplate = Mustache.render(modalTemplate, {path:path}),
            dialog = Dialogs.showModalDialogUsingTemplate(renderedTemplate),
            $element = dialog.getElement(),
            $urlField = $element.find('.fiddle-url'),
            $sdkpathField = $element.find('.sdk-path'),
            $downloadButton = $element.find('.download-button'),
            $pathButton = $element.find('.path-button'),
            $clearButton = $element.find('.clear-button'),
            clearHandler = function(e) {
                $(this).prev().val('');
                e.preventDefault();
                return false;
            };
        // focus urlfield right away
        $urlField.focus();
        // add listeners
        // on keyup, check if entry is valid
        $urlField.on('keyup', _toggleFiddleDownloadButton);
        $sdkpathField.on('change', _toggleFiddleDownloadButton);
        $pathButton.on('click', _selectPathForField);
        $clearButton.on('click', clearHandler);
        // on click, we have a valid value; download the fiddle
        $downloadButton.on('click', function (e) {
            var $fld = $(this),
                value = $urlField.val(), 
                sdkValue = $sdkpathField.val(),
                url = value.length==3 ? baseURL + value : value,
                // convert url to the correct api version
                finalUrl = url.replace('#fiddle', 'export');
            // do the business
            _downloadFiddleContent(path, finalUrl, sdkValue);
        });
    }
    
    /**
     * @private
     * Determines the version of the fiddle by inspecting the sdk urls
     * @param {String} html The html to inspect
     * @return {String}
     */
    function _getFiddleVersion(html) {
        var version = false,
            firstScript = html.match(/<script.*<\/script>/),
            key, regex;
        // did we match something?
        if(firstScript.length) {
            for( key in sdks ) {
                regex = new RegExp(key);
                // does first script src contain a version number?
                if(firstScript[0].search(regex) != -1) {
                    version = key;
                    break;
                }
            }
        }
        return version;       
    }
    
    /**
     * @private
     * Replaces sdk urls in downloaded fiddle content with local sdk urls
     * @param {String} html The html in which the replacements will be made
     * @param {String} version The version of the sdk in the downloaded fiddle
     * @param {String} sdkPath The path to the SDK
     * @return {String}
     */
    function _replaceRemoteUrls(html, version, sdkPath) {
        var sdk = sdks[version],
            replaceURL = new RegExp(sdk.remote, 'g'),
            webserverPath = prefs.get('webserver_path'),
            pathRegex = new RegExp(webserverPath),
            webpath = sdkPath.replace(pathRegex, ''),
            hostname = prefs.get('webserver_url') || 'http://localhost';
        // replace remote urls with local ones
        return html.replace(replaceURL, hostname + webpath);
    }
    
    /**
     * @private
     * Promise used to asynchronously retrieve and/or set the webserver path 
     * preference based on user selection
     */
    function _resolveWebserverPath() {
        var webserverPath = prefs.get('webserver_path') || false,
            deferred = new $.Deferred(),
            message = 'Please choose your webserver root',
            callback = function(error, dirs) {
                if (!error && dirs.length > 0) {
                    var dir = dirs.pop();
                    prefs.set('webserver_path', dir);
                    deferred.resolve(dir);
                }
            };
        if(webserverPath) {
            FileSystem.resolve(webserverPath, function(error) {
                if (error) {
                    alert('Please choose your webserver root');
                    _showPathSelector('Path to webserver root', callback);
                } else {
                    deferred.resolve(webserverPath);
                }
            });
        }
        else {
            alert('Please choose your webserver root');
            _showPathSelector('Path to webserver root', callback);
        }
        
        // return a promise which will be resolved either immediately becuase a path exists,
        // or because the user selects one via the showOpenDialog()
        return deferred.promise();
    }
    
    /**
     * @private
     * Convenience method for showing path selector
     * @param {String} title The title for the modal
     * @param {Function} callback The callback method to execute upon selection
     */
    function _showPathSelector(title,callback) {
        FileSystem.showOpenDialog(
            false,
            true,
            title,
            null,
            null,
            callback
        );
    }
    
    /**
     * @private
     * Helper to retrieve the index.html asset from the array of assets returned from webservice
     * @param {Array} assets Array of assets that belong to the fiddle
     * @return {Object}
     */
    function _getIndexAsset(assets) {
        var indexAsset,
            asset,
            i=0;
        for(; i < assets.length; i++) {
            asset = assets[i];
            if(asset.name == 'index.html') {
                // flag index asset so we can deal with it later
                indexAsset = asset;
                break;
            }
        }
        return indexAsset;
    }
    
    /**
     * @private
     * Common method for writing a fiddle asset/mockdata to file
     * @param {String} name The name of the asset (file)
     * @param {String} content The content of the file
     * @param {String} rootPath The rootpath where the fiddle is being written
     */
    function _writeLocalAsset(name, content, rootPath) {
        var i=0,
            folders,folder,folderPath,fileName,file;
        // roll over name, check 
        folders = name.split('/');
        folderPath = rootPath;
        // follow the folder structre and create one folder for each level
        for(; i < folders.length-1; i++) {
            // create folder
            folderPath = rootPath + folders.slice(0, i+1).join('/');
            folder = FileSystem.getDirectoryForPath(folderPath);
            folder.create();
        }
        // final folder path should be the full path for the
        // file we want to write
        fileName = '/' + folders[folders.length-1];
        file = FileSystem.getFileForPath(folderPath + fileName);
        file.write(content);
    }
    
    /**
     * @private
     * Once all the setup has been completed and the fiddle content has been downloaded, 
     * this method will do the heavy lifting of creating the fiddle content on the machine
     * @param {Object} fiddle The downloaded and decoded fiddle content
     * @param {String} path The path selected by the user where the fiddle should be written
     * @param {String} version The version of the SDK to use
     */
    function _createLocalFiddle(fiddle, path, version) {
        var assets = fiddle.assets,
            mockdata = fiddle.mockdata,
            indexAsset,
            urlregex = /^((http|https):\/\/)/,
            rootPath = path + '/' + fiddle.id + '/',
            i=0,
            x=0,
            asset,mock,folder;
        // create main folder that will contain the fiddle assets
        folder = FileSystem.getDirectoryForPath(rootPath);
        folder.create();
        // process the code file assets
        for (; i < assets.length; i++) {
            asset = assets[i];
            // make sure that these are actual content, and not remote urls
            if( !urlregex.test(asset.name) ) {
                // replace index.html urls to use local ones
                if(asset.name == 'index.html') {
                    asset.code = _replaceRemoteUrls(asset.code,version, fiddle.sdkPath)
                }
                _writeLocalAsset(asset.name, asset.code, rootPath);
            }
        }
        // process the mockdata items
        for(; x < mockdata.length; x++) {
            asset = mockdata[x];
            _writeLocalAsset(asset.url, asset.data, rootPath);
        }
    }
    
    /**
     * @private
     * This method will check the version of the fiddle and ensure that:
     *
     * 1.) A web server path preference has been set
     *
     * In this case, the answer could be "no", so this incorporates Deferred()
     * so that we can allow the async path selection to complete
     *
     * @param {Object} fiddle The downloaded, decoded fiddle content
     * @param {String} path The path selected from the context menu
     */
    function _preFiddleCheck(fiddle, path) {
        var indexAsset,
            version,
            prefsDeferred;

        indexAsset = _getIndexAsset(fiddle.assets);
        version = _getFiddleVersion(indexAsset.code);
         
        // uncomment to debug webserver path promise
        //prefs.set('webserver_path', '');
        if(!version) {
            Dialogs.showModalDialog('', 'Whoops!', 'Sorry, the version used by the Fiddle is not available.');
        }
        else {
            // create the deferred
            prefsDeferred = $.Deferred()
            prefsDeferred.then(function() {
                return _resolveWebserverPath();
            }).done(function() {
                _createLocalFiddle(fiddle, path, version);                
            })
            prefsDeferred.resolve();       
        } 
    }
    
    /**
     * @private
     * Retrieves fiddle data from web service
     * @param {String} path The path selected from the context menu
     * @param {String} url  The url of the fiddle to download
     * @param {String} sdkPath Path to the SDK
     */
    function _downloadFiddleContent(path, url, sdkPath) {
        $.ajax(url)
         .success(function(response, textStatus, jqXHR){
            var data = response.data;
            if(data.success && data.fiddle) {
                data.fiddle.sdkPath = sdkPath;
                _preFiddleCheck(data.fiddle, path);
            }
            else {
                Dialogs.showModalDialog('', 'Fiddle could not be downloaded', data.msg);
            }
        }).error(function(jqXHR, textStatus, errorThrown){
            Dialogs.showModalDialog('', 'Whoops!', 'Sorry, an unknown error occurred. Please try again!');
        });
    }
    
    exports.init = init;
});