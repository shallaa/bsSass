/* bsSass v0.2.0
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
	pEx = (function(){
		var rnum = /^[-]?[0-9.]+$/, rstr = /^(["][^"]*["]|['][^']*['])$/, rkey = /^[a-zA-z0-9 ]+$/,
		rvar = /^[$]\S+$/, runit = /^([-]?[0-9.]+)([^-0-9.]+)$/, rcolor = /(.)/g,
		ra = /\[[^\[\]]*\]/g, rf = /[a-zA-z$_][a-zA-z0-9$_]*[ ]*[(][^)]*[)]/g, rp = /[(][^)]*[)]/,
		rarr = /^[@]A[0-9]+[:][0-9]+[@]$/, rfunc = /^[@]F[0-9]+[:][0-9]+[@]$/, rparen = /^[@]P[0-9]+[:][0-9]+[@]$/,
		val = {'true':true,'false':false,'null':null,'undefined':undefined},
		op = {'+':1,'-':1,'*':2,'/':2},
		opf = {'+':function(a,b){return a+b;},'-':function(a,b){return a-b;},'*':function(a,b){return a*b;},'/':function(a,b){return a/b;}},
		Value = (function(){
			var v = function(){
				var i = 0, j = arguments.length;
				while( i < j ) this[arguments[i++]] = arguments[i++];
			}, fn = v.prototype;
			fn.value = 0, fn.string = '', fn.toString = fn.valueOf = function(){return this.value;};
			return v;
		})(),
		ex = function( v, f, p, a ){
			var depth, ff, fp, fa, arg, t0, t1, i, j, k;
			if( i = val[v = v.replace( trim, '' )]) return i;
			if( v.charAt(0) == '#' ){
				if( v.length == 4 ) v = '#' + v.substr(1).replace( rcolor, '$1$1');
				return new Value( 'value', v, 'r', parseInt( '0x' + v.substr( 1, 2 ) ), 'g', parseInt( '0x' + v.substr( 3, 2 ) ), 'b', parseInt( '0x' + v.substr( 5, 2 ) ) );
			}
			if( rvar.test(v) ) return VAR[v];
			if( rnum.test(v) ) return parseFloat(v);
			if( runit.test(v) ) return new Value( 'value', v, 'unit', ( t1 = v.match(runit), t1[2] ), 'v', parseFloat(t1[1]) );
			if( rstr.test(v) ) return v.substring( 1, v.length - 1 );
			if( rkey.test(v) ) return v;
			if( rarr.test(v) ){
				for( t0 = a[v.substring( 2, i = v.indexOf(':') )][v.substring( i + 1, v.length - 1 )].split(','), i = 0, j = t0.length ; i < j ; i++ ) t0[i] = ex( t0[i], f, p, a );
				return t0;
			}
			if( rfunc.test(v) ){
				v = f[v.substring( 2, i = v.indexOf(':') )][v.substring( i + 1, v.length - 1 )], t0 = FUNC[v.substring( 0, i = v.indexOf('(') )];
				for( t1 = v.substring( i + 1, v.length - 1 ).split(','), i = 0, j = t0.length ; i < j ; i++ ) t1[i] = ex( t1[i], f, p, a );
				return t0.apply( t0, t1 );
			}
			if( rparen.test(v) ) return ex( p[v.substring( 2, i = v.indexOf(':') )][v.substring( i + 1, v.length - 1 )], f, p );
			if( v.indexOf('(') > -1 ){
				f = [], ff = function(v){
					var t0 = f[depth] || ( f[depth] = [] ), i = t0.length;
					return t0[i] = v, '@F' + depth + ':' + i + '@';
				},
				p = [], fp = function(v){
					var t0 = p[depth] || ( p[depth] = [] ), i = t0.length;
					return t0[i] = v.substring( 1, v.length - 1 ).replace( trim, '' ), '@P' + depth + ':' + i + '@';
				},
				depth = 0;while( rf.test(v) ) v = v.replace( rf, ff ), depth++;
				depth = 0;while( rp.test(v) ) v = v.replace( rp, fp ), depth++;
			}
			if( v.indexOf('[') > -1 ){
				a = [], fa = function(v){
					var t0 = a[depth] || ( a[depth] = [] ), i = t0.length;
					return t0[i] = v.substring( 1, v.length - 1 ).replace( trim, '' ), '@A' + depth + ':' + i + '@';
				},
				depth = 0;while( ra.test(v) ) v = v.replace( ra, fa ), depth++;
			}
			for( arg = [], i = k = 0, j = v.length ; i < j ; i++ ) if( op[t0 = v.charAt(i)] ) arg[arg.length] = ex( v.substring( k, i ), f, p, a ), arg[arg.length] = t0, k = i + 1;
			arg[arg.length] = ex( v.substr(k), f, p, a );
			i = 3;
			while( i-- > 1 ){
				j = 1;
				while( j < arg.length ) if( op[arg[j]] == i ) arg.splice( j - 1, 3, opf[arg[j]]( arg[j - 1], arg[j + 1] ) ); else j += 2;
			}
			return arg[0];
		};
		return ex;
	})(),
	pAdd = function( v, arg, bodys ){
		var i, j;
		if( v.indexOf('@include') === 0 ){
			v = ( i = v.indexOf('(') ) > -1 ? 
				MIX[v.substring( 8, i ).replace( trim, '' )].apply( null, v.substring( i + 1, v.lastIndexOf(')') ).split(',') ) :
				MIX[v.substr(8).replace( trim, '' )]();
			for( v = v.split(';'), i = 0, j = v.length ; i < j ; i++ ) pAdd( v[i], arg, bodys );
		}else if( v = v.replace( trim, '' ) ){
			arg[arg.length] = v.substring( 0, i = v.indexOf(':') ).replace( trim, '' ),
			arg[arg.length] = pEx(v.substr( i + 1 ).replace( trim, ''));
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
				if( isDebug ) console.log( k, '{', sels.join(','), '}' );
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
	f = function( v, val, fn ){
		var k;
		if( val ) for( k in val ) VAR[k] = val[k];
		if( fn ) for( k in fn ) FUNC[k] = fn[k];
		v.substr( v.length - 4 ) == '.css' ? bs.get( parser, v ) : parser(v);
	};
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
(function(){
	var t0;
	bsSass.fn( 'function',
		'rgb', function( r, g, b ){
			return new Value( 'r', r, 'g', g, 'b', b, 'string', 'rgb(' + r + ',' + g + ',' + b + ')' );
		},
		'rgba', function( r, g, b, a ){
			return new Value( 'r', r = +r, 'g', g = +g, 'b', b = +b, 'a', a = +a, 'string', 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')' );
		},
		'hsl', t0 = (function(){
			var f = function( p, q, t ){
				if(t < 0) t += 1; else if(t > 1) t -= 1;
				return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * ( 2 / 3 - t ) * 6 : p;
			}
			return function( h, s, l ){
				var r, g, b, p, q;
				if( h > 360 ) h -= parseInt( h / 360 ) * 360;
				h /= 360;
				if( s == 0 ) r = g = b = l;
				else p = 2 * l - ( q = l < .5 ? l * ( 1 + s ) : l + s - l * s ), r = f( p, q, h + 1 / 3 ), g = f( p, q, h ), b = f( p, q, h - 1 / 3 );
				return this[arguments.length > 3 ? 'rgba' : 'rgb']( Math.round( r * 255 ), Math.round( g * 255 ), Math.round( b * 255 ), arguments[3] );
			};
		})(),
		'hsla', t0,
		'mix', function( c0, c1 ){
			var w0 = 1, w1 = 1, r, g, b;
			if( arguments.length > 2 ) w0 = arguments[2], w1 = 1 - w0;
			r = parseInt( ( c0.r * w0 + c1.r * w1 ) * .5 ),
			g = parseInt( ( c0.g * w0 + c1.g * w1 ) * .5 ),
			b = parseInt( ( c0.b * w0 + c1.b * w1 ) * .5 );
			return c0.a !== undefined && c1.a !== undefined ? this.rgba( r, g, b, ( c0.a * w0 + c1.a * w1 ) * .5 ) : this.rgb( r, g, b );
		}
	);
})();