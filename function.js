var err_code = require('./err');

exports.login_and_find = function( req, res, accountdb, callback){
    this.check_login(req, function(status){
        if(status == err_code.SUCCESS){
            accountdb.findOne({id:req.params.id}).exec(function(err, data){
                if(err) throw err;
                if(data){
                    callback(data);
                }
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    })
}

exports.check_login = function( req, callback ){
    if( req.session.item && req.session.item.log_token && req.session.item.log_token ){
        if( req.body.token ){
            if( req.session.item.log_token == req.body.token ){
                if( req.params.id && req.params.id == req.session.item.log_data.id )
                    callback(err_code.SUCCESS);
                else callback(err_code.PERMISSION_DENIED);
            }
            else callback(err_code.TOKEN_UNMATCH);
        }
        else callback(err_code.DATA_INCOM);
    }
    else callback(err_code.NOT_LOGIN);
}

exports.removeA = function(arr){
    var what, a=arguments, L=a.length, ax;
    while(L>1 && arr.length){
        what = a[--L];
        while((ax=arr.indexOf(what))!== -1){
            arr.splice(ax,1);
        }
    }
    return arr;
}


exports.trim = function(account, constraint){
    delete account.__v;
    delete account._id;

    for(i in constraint){
        delete account[constraint[i]];
    }
}

exports.randomString = function(){
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz_";
    var string_length = 25;
    var result = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        result += chars.substring(rnum,rnum+1);
    }
    return result;
}

exports.kmp_search = function(s, w){
    var m = 0, i = 0, 
        pos, cnd, t,
        slen = s.length,
        wlen = w.length;
    
    s = s.split("");
    w = w.split("");    
            
    t = [-1, 0];
    for ( pos = 2, cnd = 0; pos < wlen; ) {
        if ( w[pos-1] === w[cnd] ) {
            t[pos] = cnd + 1;
            pos++; cnd++;
        }
        else if ( cnd > 0 )
        cnd = t[cnd];
        else 
          t[pos++] = 0;
    } 
    var max = 0;
    while ( m + i < slen ) {
        if ( s[m+i] === w[i] ) {
            i++;
            if (i>max) max = i;
            if ( i === wlen ) 
              return i;
        }
        else {
            m += i - t[i];
            if ( t[i] > -1 ) 
                i = t[i];
            else
                i = 0;
        }
    }
    return max;
}
