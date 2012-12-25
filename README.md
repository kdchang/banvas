All response returned is descripted in class attribute named 'err', ex: {err:0}

the error codes are referenced below

API
==================================================================================
/signup              : sign up new account, send email for certification  
                            POST: email, password, first_name, last_name, id  
                            SERVER: send confirmation_token to 'email'   
                            EXAMPLE: $.post('/signup',{email:'b99@ntu.edu.tw',   password:'ccsp', first_name:'Ann', last_name:'Lin', id:'good'}) -> {err: 0}   

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

/:id/mod_img         : change the picture Image!!!
                            POST: token, picture (must use the form post)
                            RETURN: redirect to user page

/:id/statistic       : return the statistic of the 'id' homepage clicked time   
                            POST: token   
                            RETURN: statistic number, note: only number   
                            EXAMPLE: $.post('/111/statistic', {token: '1234561as'}) -> {err:0, view_time:0}   

/search              : return corresponding list   
                            POST: token, query   
                            RETURN: corresponding result id.   
                            EXAMPLE: $.post('/search', {query:'111'}) -> {err:0, data: result}    

/:id/ios/status      : return the data format ios mobile asked   
                            POST: token   
                            RETURN: user profile   

/:id/ios/detail      : return the user detail for ios   
                            POST: token   
                            RETURN: specific user profile detail   

/:id/skill/add       : add user's skill   
                            POST: token, skill   
                            RETURN: success or not   

/:id/skill/list      : return the user's skill with who approved it  
                            POST: token   
                            RETURN: user's skill list  

/:id/skill/delete    : delete the user's skill  
                            POST: token, skill  
                            RETURN: success or not

/:id/skill/approve   : approve the id's skill, note!!!, you do not specify who you are    
                            POST: token, skill
                            RETURN: success or not   

/:id/skill/deapprove : deapprove the id's skill, note!!!, you do not need to specify who you are    
                            POST: token, skill   
                            RETURN: success or not   

/:id/resume/add      : add data to user's resume   
                            POST: token, {Company, Position, Department}   
                            RETURN: success or not   

/:id/resume/list     : return the user's resume   
                            POST: token   
                            RETURN: {err, data}   

/:id/resume/delete   : delete user's resume   
                            POST: token, {Company, Positon, Department}   
                            RETURN: {err}


STATUS number   
====================================================   
0                    : success   
1                    : not log in    
2                    : data provided is not complete   
3                    : confirm_failed. The token is not valid to this id.   
4                    : session token not match   
5                    : user find error, may occured in register or login    
6                    : confirm error, the link may registered before or time expired   
7                    : Invalid Operation!!, please check the id or tag is valid.   
8                    : DB save error, can't save data to DB   
9                    : permission denied, can't change other person's status   
10                   : Data format is not correct, please check above README & EXAMPLE for   correct data format
11                   : Data duplicate occured!!!   
