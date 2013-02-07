
function applyEffect(cData){
    
    var frame= cData.frame,
        l= cData.l,
        r= cData.r,
        g= cData.g,
        b= cData.b,
        hsl, rgb, alpha,
        _conf= cData.conf,
        data= frame.data,
        i= 0;
    
    
    for(; i<l; i++){
        r= data[i*4];
        g= data[i*4+1];
        b= data[i*4+2];

        hsl= rgbToHsl(r, g, b);

        hsl[0]= _conf.h||hsl[0];
        hsl[1]= _conf.s||hsl[1];
        hsl[2]= _conf.l||hsl[2];

        rgb= hslToRgb(hsl[0], hsl[1], hsl[2]);

        frame.data[i*4]= rgb[0];
        frame.data[i*4+1]= rgb[1];
        frame.data[i*4+2]= rgb[2];

        if(_conf.applyFilter && _conf.curPixel){

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
                //frame.data[i*4+3]= frame.data[i*4+3];
            }
        }else{
            //frame.data[i*4+3]= frame.data[i*4+3];
        }
    }
    return frame;
}

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

if(self.postMessage){
    self.onmessage = function(event) {
        
        var data= applyEffect(event.data);
        self.postMessage(data);
    };
}