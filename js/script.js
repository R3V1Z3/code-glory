/* global jQuery, $ */
jQuery(document).ready(function() {

    // attach the plugin to an element
    $('#wrapper').gitdown( {'title': 'Code Glorify',
                            'content': 'README.md',
                            'markdownit': 'false',
                            'merge_examples': 'false',
                           } );
    
    // create slider panel
    var html = '<div class="sliders draggable">';
    html += '<div id="titlebar"><h3>Transform</h3></div>';
    html += create_slider('scale', 1, 0 ,6, 0.1);
    html += create_slider('translateX', 0, -500 ,500, 1);
    html += create_slider('translateY', 0, -500 ,500, 1);
    
    html += create_slider('perspective', 200, 0 ,2000, 1);
    html += create_slider('rotateX', 0, 0 ,360, 1);
    html += create_slider('rotateY', 0, 0 ,360, 1);
    
    html += create_slider('scaleZ', 0, 1 ,5, 0.1);
    html += create_slider('rotateZ', 0, 0 ,360, 1);
    html += create_slider('translateZ', 0, -500 ,500, 1);
    html += '</div>';
    $('#wrapper').append(html);
    
    // returns array with all transforms
    function transform() {
        var t = '';
        $('.sliders .transform').each(function(){
            // add key and value to t array
            var name = $(this).attr('name');
            var value = $(this).val();
            if ( name.indexOf('scale') != -1 ) {
                t += name + '(' + value + ')';
            } else if ( name.indexOf('rotate') != -1 ) {
                t += ' ' + name + '(' + value + 'deg)';
            } else if ( name.indexOf('translate') != -1 ) {
                t += ' ' + name + '(' + value + 'px)';
            } else if ( name.indexOf('skew') != -1 ) {
                t += ' ' + name + '(' + value + 'px)';
            } else if ( name === 'perspective' ) {
                t += ' ' + name + '(' + value + 'px)';
            }
        });
        console.log(t);
        $('.inner').css( 'transform', t );
    }
    
    // add click event to sliders
    $('.slider').on('input change', function(e) {
        var name = $(this).attr('name');
        var value = $(this).val();
        $(this).attr('value', value);
        if ( name.indexOf('scale') != -1 ) {
            transform();
        } else if ( name.indexOf('rotate' ) != -1 ) {
            transform();
        } else if ( name.indexOf('translate' ) != -1 ) {
            transform();
        } else if ( name.indexOf('skew' ) != -1 ) {
            transform();
        } else if ( name === 'perspective' ) {
            transform();
        } else {
            $('.inner').css( name, value );
        }
    });
    
    // returns html for slider and input paired with css class c
    function create_slider(name, value, min, max, step) {
        var html = '<input class="slider';
        // add transform class to items that are part of transform attribute
        var t = ['scale','rotate','translate','skew','perspective'];
        for ( var i = 0; i < t.length; i++ ) {
            if ( name.indexOf(t[i]) ) html += ' transform';
        }
        html += '"';
        html += 'name="' + name + '" ';
        html += 'type="range" min="' + min;
        html += '" max="' + max + '" value="' + value;
        html += '" step="' + step + '">';
        return html;
    }
    
    // target elements with the "draggable" class
    interact('.draggable').allowFrom('#titlebar')
        .draggable({
            // enable inertial throwing
            inertia: false,
            // keep the element within the area of it's parent
            restrict: {
              restriction: "parent",
              endOnly: true,
              elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        // enable autoScroll
        autoScroll: true,
        
        // call this function on every dragmove event
        onmove: dragMoveListener,
        // call this function on every dragend event
        onend: function (event) {
          var textEl = event.target.querySelector('p');
        
          textEl && (textEl.textContent =
            'moved a distance of '
            + (Math.sqrt(event.dx * event.dx +
                         event.dy * event.dy)|0) + 'px');
    }
    });
    
    function dragMoveListener (event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    
    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';
    
    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    }
    
    // this is used later in the resizing and gesture demos
    window.dragMoveListener = dragMoveListener;
    
});