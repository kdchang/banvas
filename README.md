All response returned is descripted in class attribute named 'err', ex: {err:0}

the error codes are referenced below

API
==================================================================================
/signup              : sign up new account, send email for certification
                            POST: email, password, first_name, last_name, id
                            SERVER: send confirmation_token to 'email'
                            EXAMPLE: $.post('/signup',{email:'b99@ntu.edu.tw', password:'ccsp', first_name:'Ann', last_name:'Lin', id:'good'}) -> {err: 0}

/signup/confirmation : certification site
                            GET: confirmation_token
                            EXAMPLE: $.get{'/signup/confirmation', {token:'0x0s11w4eas'}} -> render page!!!

/login               : return id, random string as cookie token
                            POST: email, password
                            RETURN: id, token
                            EXAMPLE: $.post('/login', {email: 'b99@ntu.edu.tw', password:'123456'}) -> {err:0, id: '111', token: '1234561as'}

/logout              : logout
                            POST: token
                            EXAMPLE: $.post('/logout', {token: '1234561as'}) -> {err:0}


/:id/status          : return details of the id, such as name, school, exprience
                            POST: token
                            RETURN: details
                            EXAMPLE: $.post('/111/status', {token: '1234561as'}) -> {err:0, data:{skill:'xxx', 'xxxx':'xxxx'.....}}

/:id/modify          : modify details of the id. 
                            POST: token, info1, info2...
                            RETURN successful changed info i1,i2...
                            EXAMPLE: $.post('/111/modify', {token: '1234561as', 'last_name':'wang', 'toilet': 'gold', 'pig':'good'}) -> {err:0, 'last_name':'wang'}
                
/:id/collection_list : return the id's collection list
                            POST: token
                            RETURN: collection [id1, tag1], [id2, tag2],...
                            EXAMPLE: $.post('/111/collection_list', {token: '1234561as'}) -> {err:0, collection:{111:teacher, 222:student}}

/:id/save            : post 'id' you want to subscribe to this site. the 'id' will be added to the collection_list, default tag = 'default' override if 'id' was already in collection_list
                            POST: token, (id,tag) pair
                            EXAMPLE: $.post('/111/save', {token:token, id:{'11':'english', '22':'math', '33':'company'}) -> {err:0, update:['11', '22']};

/:id/delete          : post 'id' you want to delect from collection, the 'id' will be deleted from the collection_list.
                            POST: token, id
                            EXAMPLE: $.post('/111/delete', {token:token, id:['11','22','33','44']}) -> {err:0, update:['11', '33']}

/:id/b-card_save     : save the current editing B-card status
                            POST: token, details of the card

/:id/b-card_load     : load the last editing B-card status
                            POST: token
                            RETURN: details of the card

/:id/configure_pull  : load personal configuration
                            POST: token
                            RETURN: configuration, such as 'tag_color', 'privacy'...

/:id/configure_push  : save personal configuration
                            POST: token, {conf1: new_conf1,...}
                            RETURN successful changed configuration c1,c2....

/:id/statistic       : return the statistic of the 'id' homepage clicked time
                            POST: token
                            RETURN: statistic number, note: only number
                            EXAMPLE: $.post('/111/statistic', {token: '1234561as'}) -> {err:0, }

/search              : return corresponding list
                            POST: token, query
                            RETURN: corresponding result id.

STATUS number
====================================================
0                    : success

1                    : not log in 

2                    : data provided is not complete

3                    : data corrupted

4                    : session token not match

5                    : user find error, may occured in register or login 

6                    : confirm error, the link may registered before or time expired

7                    : mail error, can't send email to the email address

8                    : DB save error, can't save data to DB

9                    : permission denied, can't change other person's status

10                   : Data format is not correct, please check above README & EXAMPLE for correct data format