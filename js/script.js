/* global jQuery, $, interact */
jQuery(document).ready(function() {

    // attach the plugin to an element
    $('#wrapper').gitdown( {'title': 'Code Glorify',
                            'content': 'README.md',
                            'markdownit': 'false',
                            'merge_examples': 'false',
                            'callback': main,
                           } );
    var $gd = $('#wrapper').data('gitdown');
    
    function main() {
        
        var eid_inner = '.inner';
        
        render_slider_panel();
        var css = $gd.get_css();
        
        // setup default transform if no user provided css
        if ( css === '' ) {
            css = '.inner { transform: scale(1.2) translateX(38px) translateY(83px) perspective(279px) rotateX(353deg) rotateY(3deg) scaleZ(1) rotateZ(342deg) translateZ(0px)';
        }
        
        get_transforms(css);
        register_events();
        pinch_zoom(eid_inner);
        
        function pinch_zoom( element ) {
            var scale = Number( $('.slider.scale').val() );
            interact(element)
            .gesturable({
                onmove: function (event) {
                    scale = scale * (1 + event.ds);
                    // update inner with new scale
                    update_slider( 'scale', scale );
                    dragMoveListener(event);
                    transform();
                }
            })
            .draggable({ onmove: dragMoveListener });
        }
        
        function get_transforms(css) {
            if ( css != '' ) {
                var v = parse_for_transforms(css);
                v = v.split(' ');
                for ( var i = 0; i < v.length; i++ ) {
                    // name will be all text up til paren (
                    var name = v[i].split('(')[0];
                    // value will be data after opening paren (
                    var value = v[i].split('(')[1].trim();
                    // remove closing paren )
                    value = Number(value.replace(/[^0-9\.]+/g,""));
                    console.log( 'name: ' + name + '| value: ' + value);
                    update_slider( name, value );
                }
            }
        }
        
        function parse_for_transforms(css) {
            // split at .inner
            var i = css.split( '.inner {' );
            if ( i.length > 0 ) {
                // now split at transform:
                var j = i[1].split( 'transform:' );
                if ( j.length > 0 ) {
                    // lastly, split at ;
                    var k = j[1].split( ';' );
                    if ( k.length > 0 ) {
                        var v = k[0].trim();
                        return v;
                    }
                }
            }
            return '';
        }
        
        function update_slider( name, value ) {
            $('.slider.' + name).val(value);
            $('.slider.' + name).attr('value', value);
        }
        
        function render_slider_panel() {
            var html = '<div class="sliders draggable">';
            html += '<div id="titlebar"><h3>Transform</h3></div>';
            html += create_slider('scale', 1, 0.1 ,6, 0.01);
            html += create_slider('translateX', 0, -2000 ,2000, 1);
            html += create_slider('translateY', 0, -2000 ,2000, 1);
            
            html += create_slider('perspective', 200, 0 ,2000, 1);
            html += create_slider('rotateX', 0, 0 ,360, 1);
            html += create_slider('rotateY', 0, 0 ,360, 1);
            
            html += create_slider('scaleZ', 0, 1 ,5, 0.1);
            html += create_slider('rotateZ', 0, 0 ,360, 1);
            html += create_slider('translateZ', 0, -500 ,500, 1);
            html += '</div>';
            $('#wrapper').append(html);
        }
        
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
            $(eid_inner).css( 'transform', t );
        }
        
        function register_events() {
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
            
            // mousewheel zoom handler
            $('.inner').on('wheel', function(e){
                var scale = Number( $('.slider.scale').val() );
                if(e.originalEvent.deltaY < 0) {
                    scale += 0.05;
                } else{
                    scale -= 0.05;
                }
                update_slider( 'scale', scale );
                transform();
            });
        }
        
        // returns html for slider and input paired with css class c
        function create_slider(name, value, min, max, step) {
            var html = '<input class="slider transform ';
            // add transform class to items that are part of transform attribute
            var t = ['scale','rotate','translate','skew','perspective'];
            for ( var i = 0; i < t.length; i++ ) {
                if ( name.indexOf(t[i]) != -1 ) html += ' ' + name;
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
            
            var $target = $(target);
            if ( $target.hasClass('inner') ) {
                update_slider( 'translateX', x );
                update_slider( 'translateY', y );
                transform();
            } else {
                // translate the element
                target.style.webkitTransform =
                target.style.transform =
                  'translate(' + x + 'px, ' + y + 'px)';
            }
            
            // update the position attributes
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
        }
        
        // this is used later in the resizing and gesture demos
        window.dragMoveListener = dragMoveListener;
    }
    
});