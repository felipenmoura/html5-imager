$(document).ready(function(){
    
    var _canvas= document.getElementById('canvas'),
        __canvas= $(_canvas),
        _ctx= _canvas.getContext('2d'),
        _canvasImgData= null,
        _originalImgData= false,
        _pickedColor= $('#pickedColor'),
        _currentPixelEl= $('#currentPixel'),
        _conf= {
            h: null,
            s: null,
            l: null,
            precision: 8,
            coords: false,
            applyFilter: false,
            filterLevel: 10,
            curPixel: null
        };
    
    $('#hue').slider({
        value: 50,
        max: 100,
        min: 0,
        step: 1,
        animate: false,
        slide: function(evt, handle){
            _conf.h= handle.value/100;
            _applyEffect();
            _getPixel(_conf.coords);
        }
    });
    $('#saturation').slider({
        value: 50,
        max: 100,
        min: 0,
        step: 1,
        animate: false,
        slide: function(evt, handle){
            _conf.s= handle.value/100;
            _applyEffect();
            _getPixel(_conf.coords);
        }
    });
    $('#light').slider({
        value: 50,
        max: 100,
        min: 0,
        step: 1,
        animate: false,
        slide: function(evt, handle){
            _conf.l= handle.value/100;
            _applyEffect();
            _getPixel(_conf.coords);
        }
    });
    
    $('#thumb-precision').slider({
        value: 8,
        max: 24,
        min: 6,
        step: 2,
        range: 'min',
        orientation: 'vertical',
        slide: function(evt, handle){
            _conf.precision= handle.value;
            _getPixel(_conf.coords);
        }
    });
    
    $('#filter-level').slider({
        value: 1,
        max: 254,
        min: 1,
        step: 1,
        range: 'min',
        slide: function(evt, handle){
            _conf.filterLevel= handle.value;
            _applyEffect();
        }
    });
    $('#applyFilter').click(function(){
        if(this.checked)
            _conf.applyFilter= true;
        else
            _conf.applyFilter= false;
        _applyEffect();
    });
    
    $('#newImage-ipt').change(function(evt){
        var f = evt.target.files[0];
        var fr = new FileReader();

        fr.onload = function(ev2) {
            $('#images-list').append('<img src="'+ev2.target.result+'" class="thumb"/>');
        };

        fr.readAsDataURL(f);
    });
    
    $('#download-btn').click(function(){
        window.open(_canvas.toDataURL());
    });
    
    $('#images-list').click(function(evt){
        if(evt.target.tagName == 'IMG'){
            var img= new Image();
            __canvas.addClass('loading');
            img.onload= function(){
                _canvas.width= this.width;
                _canvas.height= this.height;
                _ctx.drawImage(img, 0, 0, this.width, this.height);
                __canvas.removeClass('loading');
                __canvas.addClass('withBG');
                _canvasImgData= _ctx.getImageData(0, 0, this.width, this.height);
                _originalImgData= _ctx.getImageData(0, 0, this.width, this.height);
            };
            img.src= evt.target.src;
        }
    });
    
    
    var _resetEffects= function(){
        
        _conf= {
            h: null,
            s: null,
            l: null,
            precision: 8,
            coords: false,
            applyFilter: false,
            filterLevel: 10,
            curPixel: null
        };
        
        _ctx.putImageData(_originalImgData, 0, 0);
        _canvasImgData= _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
        //_applyEffect();
    };
    
    $('#clear-btn').click(_resetEffects);
    
    /**
    * Converts an RGB color value to HSL. Conversion formula
    * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
    * Assumes r, g, and b are contained in the set [0, 255] and
    * returns h, s, and l in the set [0, 1].
    * Thanks to http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    *
    * @param   Number  r       The red color value
    * @param   Number  g       The green color value
    * @param   Number  b       The blue color value
    * @return  Array           The HSL representation
    */
    function rgbToHsl(r, g, b){
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    }

    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     * Thanks to http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  l       The lightness
     * @return  Array           The RGB representation
     */
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r * 255, g * 255, b * 255];
    }
    
    
    
    var _applyEffect= function(){
        
        var r, g, b, i=0, hsl, rgb, alpha,
            data= _canvasImgData.data,
            l= data.length/4,
            frame= _canvasImgData;
        
        if(!_canvasImgData)
            return false;
        
        for(; i<l; i++){
            r= data[i*4];
            g= data[i*4+1];
            b= data[i*4+2];
            
            hsl= rgbToHsl(r, g, b);
            
            hsl[0]= _conf.h||hsl[0];
            hsl[1]= _conf.s||hsl[1];
            hsl[2]= _conf.l||hsl[2];//hsl[2]//+(_conf.l||hsl[2]);
            
            rgb= hslToRgb(hsl[0], hsl[1], hsl[2]);
            
            frame.data[i*4]= rgb[0];
            frame.data[i*4+1]= rgb[1];
            frame.data[i*4+2]= rgb[2];
            
            if(_conf.applyFilter){
                
                alpha= 0;
                if(
                    (Math.abs(_conf.curPixel[0] - r) <= _conf.filterLevel)
                        &&
                    (Math.abs(_conf.curPixel[1] - g) <= _conf.filterLevel)
                        &&
                    (Math.abs(_conf.curPixel[2] - b) <= _conf.filterLevel)
                  ){
                    frame.data[i*4+3]= alpha;
                }else{
                    frame.data[i*4+3]= 255;
                }
            }else{
                frame.data[i*4+3]= 255;
            }
        }
        _ctx.putImageData(frame, 0, 0);
    };
    
    var _getPixel= function(evt){
        
        if(!evt)
            return false;
        
        var x= evt.originalEvent? evt.originalEvent.offsetX: evt[0],
            y= evt.originalEvent? evt.originalEvent.offsetY: evt[1],
            data= null,
            precision= _conf.precision,
            dataAttr= '',
            pickedColorString= "",
            container= $('#selectedPx'),
            l, i= 0, str= "";
        
        _conf.coords= [x, y];
        
        if(x<precision/2){
            x= 2;
        }
        if(x+(precision/2) >_canvas.width){
            x= _canvas.width - (precision/2);
        }
        
        if(y<precision/2){
            y= precision/2;
        }
        if(y+(precision/2) >_canvas.height){
            y= _canvas.height - 2;
        }
        
        x-= precision/2;
        y-= precision/2;
        
        data= _ctx.getImageData(x, y, precision, precision).data;
        _conf.curPixel= _ctx.getImageData(x, y, 1, 1).data;
        pickedColorString= 'rgba('+_conf.curPixel[0]+', '+_conf.curPixel[1]+', '+_conf.curPixel[2]+', '+_conf.curPixel[3]+')';
        _pickedColor.val(pickedColorString);
        
        l= data.length/4;
        
        for(; i<l; i++){
            dataAttr= (data[i*4] +','+ data[i*4+1] +','+ data[i*4+2] +','+ data[i*4+3] );
            str+= "<div style='width: "+(container[0].offsetWidth/(precision) - 0.3)+"px; height: "+(container[0].offsetHeight/(precision) - 0.3)+"px; background-color: rgba("+dataAttr+")' data-color='rgba("+dataAttr+")' data-x='"+x+"' data-y='"+y+"'></div>";
        }
        
        container.html(str);
        container.find('div').on('click', function(){
            var data= $(this).attr('data-color');
            _pickedColor.val(data);
            _conf.curPixel= _ctx.getImageData($(this).attr('data-x'), $(this).attr('data-y'), 1, 1).data;
            //console.log(_ctx.getImageData($(this).attr('data-x'), $(this).attr('data-y'), 1, 1))
            _currentPixelEl.css('backgroundColor', data);
            _applyEffect();
        });
        _currentPixelEl.css('backgroundColor', pickedColorString);
        _applyEffect();
        
    };
    
    __canvas.click(_getPixel);
    
    _canvas.width= document.body.clientWidth - 255;
    _canvas.height= document.body.clientHeight - 94;
});