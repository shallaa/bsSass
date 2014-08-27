/* bsSass v0.1.3
 * Copyright (c) 2013 by ProjectBS Committe and contributors. 
 * http://www.bsplugin.com All rights reserved.
 * Licensed under the BSD license. See http://opensource.org/licenses/BSD-3-Clause
 */
var bsSass = (function( trim, bs ){
	'use strict';
	var rNum = /^[0-9.-]+$/, rSel = /[};][^};]+$/g, rParent = /[&]/g,
	VAR = {}, rVAL = /\$[^;:]+[:][^;:]+;/g, fVAL = function(v){return v = v.substring( 0, v.length - 1 ).split(':'), VAR[v[0]] = v[1], '';},
	MIX = {}, rMIX = /[@]mixin [^@{]+[{][^@{()}]+[}]/g, fMIX = function(v){
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
	extend, rExtend = /[@]extend (.+)[;]/g, fExtend = function( $0, v ){return extend[v] || '';},
	pAdd = function( v, arg, bodys ){
		var i, j;
		if( v.indexOf('@include') === 0 ){
			v = ( i = v.indexOf('(') ) > -1 ? 
				MIX[v.substring( 8, i ).replace( trim, '' )].apply( null, v.substring( i + 1, v.lastIndexOf(')') ).split(',') ) :
				MIX[v.substr(8).replace( trim, '' )]();
			for( v = v.split(';'), i = 0, j = v.length ; i < j ; i++ ) pAdd( v[i], arg, bodys );
		}else if( v = v.replace( trim, '' ) ){
			arg[arg.length] = j = v.substring( 0, i = v.indexOf(':') ).replace( trim, '' );
			v = v.substr( i + 1 ).replace( trim, ''), v = VAR[v] || v,
			arg[arg.length] = rNum.test(v) ? parseFloat(v) : v;
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
				if( t1 != t0[k][0] ) delete bodys[self];
			}
		extend = bodys;
		for( k in bodys ) bodys[k] = bodys[k].replace( rExtend, fExtend );
		for( k in bodys ){
			if( k.indexOf('@') == -1 ){
				if( k.charAt(0) == '%' ) continue;
				console.log( k, bodys[k] );
				for( c = bs.Css(k), v = bodys[k].split(';'), sels.length = i = 0, j = v.length; i < j ; i++ ) if( t0 = v[i].replace( trim, '' ) ) pAdd( t0, sels, bodys );
				c.S.apply( c, sels );
			}else if( sel.substr( 0, 9 ) == 'font-face' ) bs.Css( k + ' ' + v );
		}
		if( !bs.cls ) bs.Css.flush();
	};
	return bs.cls ? function(v){v.substr( v.length - 4 ) == '.css' ? bs.get( parser, v ) : parser(v);} : parser;
})( /^\s*|\s*$/g, {
	trim:function(v){
		var i = v.length;
		while(i--) v[i].replace( /^\s*|\s*$/g, '' );
		return v;
	},
	Css:(function(){
		var r = '', c = function(sel){
			r += sel + '{';
			return s;
		}, s = {
			S:function(){
				var i = 0, j = arguments.length;
				while( i < j ) r += arguments[i++] + ':' + arguments[i++] + ';'
				r += '}';	
			}
		};
		c.flush = function(){
			var t0 = document.createElement('style');
			t0.innerHTML = r;
			document.getElementsByTagName('head')[0].appendChild( t0 );
		};
		return c;
	})()
} );