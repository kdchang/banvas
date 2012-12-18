All response returned is descripted in class attribute named 'err', ex: {err:0}

the error codes are referenced below

API
==================================================================================
/signup              : sign up new account, send email for certification
                            POST: email, password, first_name, last_name, id
                            SERVER: send confirmation_token to 'email'

/signup/confirmation : certification site
                            GET: confirmation_token

/login               : return id, random string as cookie token
                            POST: email, password
                            RETURN: id, token

/logout              : logout
                            POST: token

/:id/status          : return details of the id, such as name, school, exprience
                            POST: token
                            RETURN: details

/:id/modify          : modify details of the id. 
                            POST: token, {info1: info1,...}
                            RETURN successful changed info i1,i2...
                
/:id/collection_list : return the id's collection list
                            POST: token
                            RETURN: collection [id1, tag1], [id2, tag2],...

/:id/save            : post 'id' you want to subscribe to this site. the 'id' will add to the collection_list, default tag = 'default' override if 'id' was already in collection_list
                            POST: token, id, [optional]tag

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