/* bsSass v0.1.3
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
	FUNC = {
		_num:function(v){
			var i;
			if( v.splice ){
				i = v.length;
				while( i-- ) typeof v[i] == 'string' ? ( v[i] = ( v[i] = v[i].replace( trim, '' ) ) ? v[i].charAt( v[i].length - 1 ) == '%' ? parseFloat( v[i].substring(0, v[i].length - 1 ) ) * .01 : v[i].substr( 0, 2 ) == '0x' ? parseInt( v[i], 16 ) : parseFloat(v[i]) : 0 ) : 0;
				return v;
			}
			return typeof v == 'string' ? ( v = v.replace( trim, '' ) ) ? v.charAt( v.length - 1 ) == '%' ? parseFloat( v.substring(0, v.length - 1 ) ) * .01 : v.substr( 0, 2 ) == '0x' ? parseInt( v, 16 ) : parseFloat(v) : 0 : v;
		}
	},
	extend, rExtend = /[@]extend (.+)[;]/g, fExtend = function( g, v ){return extend[v] || '';},
	pVal = function(v){
		var i, j;
		v = ( i = v.indexOf('(') ) > -1 && ( FUNC[j = v.substring( 0, i )] ) ?
			FUNC[j]( v.substring( i + 1, v.lastIndexOf(')') ).split(',') ) :
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
		var sels = [], bodys = {}, parent = {}, sorts = [], depth, self, c, t0, t1, i, j, k, l, w0, w1, w2;
		v = v.replace( rMIX, fMIX ).replace( rVAL, fVAL );
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
		for( k in bodys ){
			if( k.indexOf('@') == -1 ){
				if( k.charAt(0) == '%' ) continue;
				for( c = bs.Css(k), v = bodys[k].split(';'), sels.length = i = 0, j = v.length; i < j ; i++ ) if( t0 = v[i].replace( trim, '' ) ) pAdd( t0, sels, bodys );
				c.S.apply( c, sels );
				if( isDebug ) console.log( k, sels );
			}else if( sel.substr( 0, 9 ) == 'font-face' ) bs.Css( k + ' ' + v );
		}
	},
	f = bs.cls ? function(v){v.substr( v.length - 4 ) == '.css' ? bs.get( parser, v ) : parser(v);} : function(v){parser(v),bs.Css.flush();};
	return f.fn = (function(){
		var t = {mixin:MIX, 'var':VAR, 'function':FUNC};
		return function( type ){
			var t0, i = 1, j = arguments.length;
			if( t0 = t[type] ) while( i < j ) t0[arguments[i++]] = arguments[i++];
		};
	})(), f;
})( /^\s*|\s*$/g, {
	Css:(function(){
		var r = '', c = function(sel){
			return r += sel + '{', s;
		}, s = {S:function(){
			var i = 0, j = arguments.length;
			while( i < j ) r += arguments[i++] + ':' + arguments[i++] + ';'
			r += '}';	
		}};
		c.flush = function(){
			var t0 = document.createElement('style');
			t0.innerHTML = r, r = '', document.getElementsByTagName('head')[0].appendChild( t0 );
		};
		return c;
	})()
}, true );
// http://www.sass-lang.com/documentation/Sass/Script/Functions.html
builtinFunction:
bsSass.fn( 'function',
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
			else
				while( v[i].length < 8 ) v[i] += '0';
			v[i] = this._num(v[i]);
		}
		f = v[0], l = v[1], w = this._num(v[2]),
		r = ( ( w ? f * w + l * ( 1 - w ) : f + l ) / 2 ).toString(16);
		while( r.length < 6 ) r = '0' + r;
		return '0x' + r;
	},
	'lighten', function(v){},
	'darken', function(v){},
	'saturate', function(v){},
	'desaturate', function(v){},
	'grascale', function(v){},
	'invert', function(v){},
	'complement', function(v){}
);