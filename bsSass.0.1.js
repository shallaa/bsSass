var bsSass = (function( trim, bs ){
	var r = /^[0-9.-]+$/, VAR, MIX,
	r0 = /\$[^;:]+[:][^;:]+;/g, f0 = function(v){
		v = v.substring( 0, v.length - 1 ).split(':');
		VAR[v[0]] = v[1];
		return '';
	},
	r1 = /[@]mixin [^@{]+[{][^@{()}]+[}]/g, f1 = function(v){
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
		}).toString(), i.substring( i.indexOf('var') - 1, i.lastIndexOf('}') ) ) )( b, bs.trim(arg.split(',')), trim );
		return '';
	},
	wrapSel = [], wrapBody = [], rc = /[{]/g,
	parser = function( v, V, M ){
		var arg = [], t0, v, i, j, k, l, m, n, o, p, w0, w1, w2, w3, w4, w5, w6, sel, val;
		VAR = V || {}, MIX = M || {}, v = v.replace( r1, f1 ).replace( r0, f0 );
		for( v = v.split('}'), i = 0, j = v.length ; i < j ; i++ ){
			if( t0 = v[i].replace( trim, '' ) ){
				sel = t0.substring( 0, k = t0.indexOf('{') ).replace( trim, '' ), val = t0.substr( k + 1 );
				if( val.indexOf('{') > -1 ){
					for( wrapSel.length = wrapBody.length = 0, wrapSel[0] = sel, w4 = k = m = n = 0, l = val.match(rc).length ; k < l ; k++ ){
						n = val.indexOf( '{', m );
						w0 = val.substring( m, n );
						w1 = w0.lastIndexOf(';') + 1;
						w2 = w0.substr( w1 ).replace( trim, '' );
						w3 = w0.substring( 0, w1 ).replace( trim, '' ) + v[i + l - k].replace( trim, '' );
						if( w2.charAt( w2.length - 1 ) == ':' ){
							w4 = w2.substring( 0, w2.length - 1 ) + '-',
							wrapBody[wrapBody.length] = w3;
						}else{
							wrapSel[wrapSel.length] = w2;
							if( w4 ){
								for( w3 = w3.split(';'), w5 = wrapBody.length - 1, o = 0, p = w3.length ; o < p ; o++ ) if( w6 = w3[o].replace( trim, '' ) ) wrapBody[w5] += w4 + w6 + ';';
								w4 = 0;
							}else wrapBody[wrapBody.length] = w3;
						}
						m = n + 1;
					}
					w3 = val.substr(m).replace( trim, '' );
					if( w4 ){
						for( w3 = w3.split(';'), w5 = wrapBody.length - 1, o = 0, p = w3.length ; o < p ; o++ ) if( w6 = w3[o].replace( trim, '' ) ) wrapBody[w5] += w4 + w6 + ';';
						w4 = 0;
					}else wrapBody[wrapBody.length] = w3;
					for( k = 0, l = wrapSel.length ; k < l ; k++ ){
						css( wrapSel[k], wrapBody.slice( 0, k + 1 ).join('') );
					}
					i += l;
				}else css( sel, val );
			}
		}
		if( !bs.cls ) bs.Css.flush();
	},
	carg = [], css = function( sel, v ){
		var c, t0, i, j, k, l;
		if( sel.indexOf('@') == -1 ){
			for( c = bs.Css(sel), v = v.split(';'), carg.length = 0, i = 0, j = v.length; i < j ; i++ ){
				if( t0 = v[i].replace( trim, '' ) ){
					if( t0.indexOf('@include') === 0 ){
						t0 = ( k = t0.indexOf('(') ) > -1 ? 
							MIX[t0.substring( 8, k ).replace( trim, '' )].apply( null, t0.substring( k + 1, t0.lastIndexOf(')') ).split(',') ) :
							MIX[t0.substr(8).replace( trim, '' )]();
						for( t0 = t0.split(';'), k = 0, l = t0.length ; k < l ; k++ ) add( carg, t0[k] );
					}else if( t0.indexOf('@extend') === 0 ){
					}else add( carg, t0 );
				}
			};
			c.S.apply( c, carg );
		}else if( sel.substr( 0, 9 ) == 'font-face' ) bs.Css( sel + ' ' + val.replace( trim, '' ) );
	},
	add = function( arg, v ){
		var i, j;
		if( v = v.replace( trim, '' ) ){
			arg[arg.length] = v.substring( 0, i = v.indexOf(':') ).replace( trim, '' ), 
			v = v.substr( i + 1 ).replace( trim, ''),
			v = VAR[v] || v,
			arg[arg.length] = r.test(v) ? parseFloat(v) : v;
		}
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
			console.log(r);
			document.getElementsByTagName('head')[0].appendChild( t0 );
		};
		return c;
	})()
} );