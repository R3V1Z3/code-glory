hljs.initHighlightingOnLoad();
jQuery(document).ready(function() {

    // from here: http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null
    }

    // get gist url parameters
    var gist = getURLParameter('gist');
    if (!gist) {
        // stop execution here if no gist parameter specified
        throw new Error("Include gist= parameter in url to continue.");
    }

    // clear container contents and remove initial styles
    $('#container').remove();
    $('link[rel=stylesheet]').remove();
    var filename = getURLParameter('filename');

    // get highlight.js style if provided
    var style = getURLParameter('style');
    if (!style) style = 'default';

    // get css parameters
    var css = getURLParameter('css');
    if (!css) css = '3df562d921295d88564e24b828c0b8b6';
    var cssfilename = getURLParameter('cssfilename');

    // add style reference to head to load it
    $('head').append('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/' + style.replace(/[^a-zA-Z0-9-_]+/ig, '') + '.min.css">');

    function render(content) {
        // syntax highlight code
        $('div#code').text(content);
        $('div#code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
        // #code-overlay also, then hide it, user can unhide if needed
        $('div#code-overlay').text(content);
        $('div#code-overlay').each(function(i, block) {
            hljs.highlightBlock(block);
        });
        $('div#code-overlay').hide();
        // copy code bg color to body bg
        $('body').css('background', $('div#code').css('background'));
    }

    function rendercss(content) {
        // attempt to sanitize CSS so hacker don't splode our website
        var parser = new HtmlWhitelistedSanitizer(true);
        var sanitizedHtml = parser.sanitizeString(content);
        // add imported css to head
        $('head').append('<style>' + sanitizedHtml + '</style>');
        // make inner div draggable and give it move pointer
        $('#inner').draggable();
        $('#inner').css('cursor', 'move');
        $('#canvas').hide();
    }

    // http://stackoverflow.com/questions/9005572/pull-in-json-data/10454873#10454873
    $.ajax({
        url: 'https://api.github.com/gists/' + gist,
        type: 'GET',
        dataType: 'jsonp'
    }).success(function(gistdata) {
        var objects = [];
        if (!filename) {
            for (var file in gistdata.data.files) {
                if (gistdata.data.files.hasOwnProperty(file)) {
                    var o = gistdata.data.files[file].content;
                    if (o) {
                        objects.push(o);
                    }
                }
            }
        }
        else {
            objects.push(gistdata.data.files[filename].content);
        }
        render(objects[0]);
    }).error(function(e) {
        console.log('Error on ajax return.');
    });

    $.ajax({
        url: 'https://api.github.com/gists/' + css,
        type: 'GET',
        dataType: 'jsonp'
    }).success(function(gistdata) {
        var objects = [];
        if (!cssfilename) {
            for (var file in gistdata.data.files) {
                if (gistdata.data.files.hasOwnProperty(file)) {
                    var o = gistdata.data.files[file].content;
                    if (o) {
                        objects.push(o);
                    }
                }
            }
        }
        else {
            objects.push(gistdata.data.files[cssfilename].content);
        }
        rendercss(objects[0]);
    }).error(function(e) {
        console.log('Error on ajax return.');
    });

});