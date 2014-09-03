/* bsSass v0.1.4
 * Copyright (c) 2013 by ProjectBS Committe and contributors. 
 * http://www.bsplugin.com All rights reserved.
 * Licensed under the BSD license. See http://opensource.org/licenses/BSD-3-Clause
 */
var bsSass = (function( trim, bs, isDebug ){
	'use strict';
	var rNum = /^[-]?[0-9.]+$/, rSel = /[};][^};]+$/g, rParent = /[&]/g,
	VAR = {}, rVAL = /\$[^;:]+[:][^;:]+;/g, fVAL = function(v){return v = v.substring( 0, v.length - 1 ).split(':'), VAR[v[0]] = pVal(v[1]), '';},
	MIX = {}, rMIX = /[@]mixin [^@{]+[{][^}]+[}]/g, fMIX = function(v){
		var n, arg = '', b, i;
		v = v.substr(7).split('{'), n = v[0].replace( trim, '' );
		if( ( i = n.indexOf('(') ) > -1 ) arg = n.substring( i + 1, n.lastIndexOf(')') ).replace( trim, '' ), n = n.substring( 0, i ).replace( trim, '' );
		b = v[1], b = b.substring( 0, b.lastIndexOf('}') ),
		MIX[n] = new Function( 'b,arg,trim', ( i = (function(){
			var r = [], j = arg.length, i = j;
			while( i-- ) r[i] = new RegExp( '[$]' + arg[i].replace( trim, '' ).substr(1), 'g' );
			return function(){
				var i = j;
				while(i--) b = b.replace( r[i], arguments[i] ? arguments[i].replace( trim, '' ) : '' );
				return b;
			};
		} ).toString(), i.substring( i.indexOf('var') - 1, i.lastIndexOf('}') ) ) )( b, arg.split(','), trim );
		return '';
	},
	FUNC = {},
	imports = [], rImport = /[@]import ['"]?([^'"]+)['"][;]/g, fImport = function( g, v ){
		return imports[g = imports.length] = v.indexOf('.') == -1 ? v + '.css' : v, '@I' + g + 'I@';
	},
	extend, rExtend = /[@]extend (.+)[;]/g, fExtend = function( g, v ){return extend[v] || '';},
	placeholder = {},
	pVal = function(v){
		var i, j;
		v = ( i = v.indexOf('(') ) > -1 && ( FUNC[j = v.substring( 0, i )] ) ?
			FUNC[j](v.substring( i + 1, v.lastIndexOf(')') ).split(',')) :
			VAR[v] === undefined ? v : VAR[v];
		return rNum.test(v) ? parseFloat(v) : v;
	},
	pAdd = function( v, arg, bodys ){
		var i, j;
		if( v.indexOf('@include') === 0 ){
			v = ( i = v.indexOf('(') ) > -1 ? 
				MIX[v.substring( 8, i ).replace( trim, '' )].apply( null, v.substring( i + 1, v.lastIndexOf(')') ).split(',') ) :
				MIX[v.substr(8).replace( trim, '' )]();
			for( v = v.split(';'), i = 0, j = v.length ; i < j ; i++ ) pAdd( v[i], arg, bodys );
		}else if( v = v.replace( trim, '' ) ){
			arg[arg.length] = v.substring( 0, i = v.indexOf(':') ).replace( trim, '' ),
			arg[arg.length] = pVal(v.substr( i + 1 ).replace( trim, ''));
		}
	},
	pData = function( v, depth, sels, bodys ){
		var i, j;
		for( v = v.replace( trim, '' ).split('}'), i = 0, j = v.length ; i < j ; i++ ){
			if( depth && v[i] ) bodys[sels[depth - 1]] += v[i].replace( trim, '' );
			depth--;
		}
		return depth + 1;
	},
	parser = function( v ){
		var imported, sels, bodys, parent, sorts, depth, self, c, t0, t1, i, j, k, l, w0, w1, w2;
		imports.length = 0,
		v = v.replace( rImport, fImport ).replace( rMIX, fMIX ).replace( rVAL, fVAL );
		if( imports.length ) return ( imported = function(data){
			data && ( v = v.replace( '@I' + imports.length + 'I@', data ) ), imports.length ? bs.get( imported, imports.pop() ) : parser(v);
		})();
		sels = [], bodys = {}, parent = {}, sorts = [];
		for( k in placeholder ) bodys[k] = placeholder[k];
		depth = i = j = 0;
		while( ( j = v.indexOf( '{' , j ) ) > -1 ){
			w0 = v.substring( i, j ).replace( trim, '' ),
			bodys[w2 = ( w1 = w0.match(rSel) ) ? w1[0].substr(1).replace( trim, '' ) : w0] = '',
			parent[w2] = sels.slice( 0, depth = pData( w0.substring( 0, w0.indexOf(w2) ), depth, sels, bodys ) ),
			sels[depth] = w2, i = ++j, depth++;
		}
		pData( v.substring(i), depth, sels, bodys );
		for( k in parent ){
			t0 = parent[k];
			if( i = t0.length ) i--, t1 = sorts[i] || ( sorts[i] = [] ), t1[t1.length] = [k, t0[i]];
		}
		for( i = 0, j = sorts.length ; i < j ; i++ )
			for( t0 = sorts[i], k = 0, l = t0.length ; k < l ; k++ ){
				self = t0[k][0], parent = t0[k][1], bodys[t1 = self.replace( rParent, parent )] = bodys[parent] + bodys[self];
				if( t1 != self ) delete bodys[self];
			}
		extend = bodys;
		for( k in bodys ) bodys[k] = bodys[k].replace( rExtend, fExtend );
		w0 = '';
		for( k in bodys ){
			if( k.indexOf('@') == -1 ){
				if( k.charAt(0) == '%' ){
					placeholder[k] = bodys[k];
					continue;
				}
				for( v = bodys[k].split(';'), sels.length = i = 0, j = v.length; i < j ; i++ ) if( t0 = v[i].replace( trim, '' ) ) pAdd( t0, sels, bodys );
				if( isDebug ) console.log( k, '{', sels, '}' );
				w0 += k + '{' + css(sels) + '}\n';
			}else w0 += k + '{' + bodys[k] + '}';
		}
		document.getElementsByTagName('head')[0].appendChild( w1 = document.createElement('style') ),
		w1['styleSheet'] ? ( w1['styleSheet'].cssText = w0 ) : ( w1.innerHTML = w0 );
	},
	css = function(v){
		var r = '', i = 0, j = v.length;
		while( i < j ) r += v[i++] + ':' + v[i++] + ';'
		return r;
	},
	f = function(v){v.substr( v.length - 4 ) == '.css' ? bs.get( parser, v ) : parser(v);};
	return f.fn = (function(){
		var t = {mixin:MIX, 'var':VAR, 'function':FUNC};
		return function( type ){
			var t0, i = 1, j = arguments.length;
			if( t0 = t[type] ) while( i < j ) t0[arguments[i++]] = arguments[i++];
		};
	})(), f;
})( /^\s*|\s*$/g, {
	get:(function(xhr){
		return xhr = window['XMLHttpRequest'] ? function(){return new XMLHttpRequest;} : (function(){
			var t0 = 'MSXML2.XMLHTTP.', i, j;
			t0 = ['Microsoft.XMLHTTP', t0, t0 + '3.0', t0 + '4.0', t0 + '5.0'], i = t0.length;
			while( i-- ){try{new ActiveXObject( j = t0[i] );}catch($e){continue;}break;}
			return function(){return new ActiveXObject(j);};
		})(), function( end, url ){
			var t0 = xhr();
			t0.onreadystatechange = function(){
				if( t0.readyState != 4 ) return;
				end( t0.status == 200 || t0.status == 0 ? t0.responseText : '' );
			}, t0.open( 'GET', url, false ), t0.send('');
		};
	})()
}, true );
// http://www.sass-lang.com/documentation/Sass/Script/Functions.html
builtinFunction:
bsSass.fn( 'function',
	'_num', (function(){
		var re = /(.)/g;
		return function(v){
			var i, t0;
			if( v.splice ){
				i = v.length;
				while( i-- ) typeof v[i] == 'string' ? ( v[i] = ( v[i] = v[i].replace( trim, '' ) ) ? v[i].charAt( v[i].length - 1 ) == '%' ? parseFloat( v[i].substring(0, v[i].length - 1 ) ) * .01 : v[i].substr( 0, 2 ) == '0x' ? ( t0 = v[i].slice(2) ).length == 3 ? parseInt( '0x' + t0.replace( re, '$1$1' ), 16 ) : parseInt( v[i], 16 ) : parseFloat(v[i]) : 0 ) : 0;
				return v;
			}
			return typeof v == 'string' ? ( v = v.replace( trim, '' ) ) ? v.charAt( v.length - 1 ) == '%' ? parseFloat( v.substring(0, v.length - 1 ) ) * .01 : v.substr( 0, 2 ) == '0x' ? ( t0 = v.slice(2) ).length == 3 ? parseInt( '0x' + t0.replace( re, '$1$1' ), 16 ) : parseInt( v, 16 ) : parseFloat(v) : 0 : v;
		};
	})(),
	'_shadeColor', function( c, a ){
		var t, p;
		if( !c.indexOf('hsl') );// TODO : hsl(...)
    return c = this._hex2rgb(c), t = a < 0 ? 0 : 255, p = a < 0 ? a * -1 : a, "0x" + ( 0x1000000 + ( Math.round( ( t - c[0] ) * p ) + c[0] ) * 0x10000 + ( Math.round( ( t - c[1] ) * p ) + c[1] ) * 0x100 + ( Math.round( ( t - c[2] ) * p ) + c[2] ) ).toString(16).substr(1);
	},
	'_hex2rgb', function( h ){
		var f;
		if( c.length != 5 ) while( c.length < 8 ) c += '0';
		return f = this._num(h), [ f>>16, f>>8&0x00FF, f&0x0000FF ];
	},
	'_rgb2hsl', function( r, b, g ){
		var max, min, h, s, l, d;
		r /= 255, g /= 255, b /= 255,
		max = Math.max(r, g, b), min = Math.min(r, g, b),
		h, s, l = (max + min) / 2;
		if(max == min) h = s = 0;
		else{
			d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
			case r: h = ( g - b ) / d + ( g < b ? 6 : 0 ); break;
			case g: h = ( b - r ) / d + 2; break;
			case b: h = ( r - g ) / d + 4; break;
			}
			h /= 6;
		}
		return [ h, s, l ];
	},
	'rgb', function(v){
		var c, i, k;
		for( c = '#', i = 0 ; i < 3 ; i++ ) k = ( v[i] = this._num(v[i]) ), c += k ? ( k > 255 ? 255 : k ).toString(16) : '00';
		return c;
	},
	'rgba', function(v){
		var c, i, k;
		for( this._num(v), c = 'rgba(', i = 0 ; i < 3 ; i++ ) c += ( v[i] ? ( v[i] > 255 ? 255 : v[i] ) : '00' ) + ',';
		return c + ( v[3] > 1 ? 1 : v[3] < 0 ? 0 : v[3] ) + ')';
	},
	'hsl', (function(){
		var f = function( p, q, t ){
			if(t < 0) t += 1; else if(t > 1) t -= 1;
			return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * ( 2 / 3 - t ) * 6 : p;
		}
		return function(v){
			var h, s, l, p, q;
			v = this._num(v), s = v[1], l = v[2];
			if( ( h = v[0] ) > 360 ) h -= parseInt( h / 360 ) * 360;
			h /= 360;
			if(s == 0) v[0] = v[1] = v[2] = l;
			else p = 2 * l - ( q = l < .5 ? l * ( 1 + s ) : l + s - l * s ), v[0] = f( p, q, h + 1 / 3 ), v[1] = f( p, q, h ), v[2] = f( p, q, h - 1 / 3 );
			p = 3;
			while( p-- ) v[p] = Math.round( v[p] * 255 );
			return this.rgb(v);
		};
	})(),
	'hsla', function(v){return this.hsl(v), this.rgba(v);},
	'mix', function(v){
		var f, l, w, i, r;
		i = 2;
		while( i-- ){
			if( !v[i].indexOf('rgb') );// TODO : rgb(...)
			if( v[i].length != 5 ) while( v[i].length < 8 ) v[i] += '0';
			v[i] = this._num(v[i]);
		}
		f = v[0], l = v[1], w = this._num(v[2]),
		r = ( ( w ? f * w + l * ( 1 - w ) : f + l ) / 2 ).toString(16);
		while( r.length < 6 ) r = '0' + r;
		return '0x' + r;
	},
	'lighten', function(v){
		return this._shadeColor( v[0], this._num(v[1]) );
	},
	'darken', function(v){
		return this._shadeColor( v[0], this._num(v[1]) * -1 );
	},
	'saturate', function(v){
		var t0 = this._hex2rgb(v[0]);
		return t0 = this._rgb2hsl( t0[0], t0[1], t0[2] ), t0[1] += this._num(v[1]), this.hsl(t0);
	},
	'desaturate', function(v){
		var t0 = this._hex2rgb(v[0]);
		return t0 = this._rgb2hsl( t0[0], t0[1], t0[2] ), t0[1] -= this._num(v[1]), this.hsl(t0);
	},
	'grascale', function(v){
		var t0 = this._hex2rgb(v[0]);
		return t0 = (t0[0] + t0[1] + t0[2]) / 3, this.rgb([ t0, t0, t0 ]);
	},
	'invert', function(v){
		var t0  = this._hex2rgb(v[0]);
		return '0x' + ( 255 - t0[0] ).toString(16) + ( 255 - t0[1] ).toString(16) + ( 255 - t0[1] ).toString(16);
	},
	'complement', function(v){
		var t0 = this._hex2rgb(v[0]);
		return t0 = this._rgb2hsl( t0[0], t0[1], t0[2] ), t0[0] = 180, this.hsl(t0);
	}
);