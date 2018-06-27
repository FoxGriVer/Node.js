var LocalStratagy = require('passport-local').Strategy;
var mysql = require("mysql");

var connectionMySQL = mysql.createConnection({
    host: '147.135.223.202',
    user: 'dotcomuser',
    password:'скрыто',
    database:'summerpractice'
});

connectionMySQL.connect(function(error){
    if(error){
        console.log("Error occurred while connecting to the dataBase");
    }
    else{
        console.log("We have successfully connected to dataBase");
    }
});

function databaseFunctions(passport){

    passport.serializeUser(function(user, done) {
        //console.log('Serialize user called.');
		done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        //console.log('Deserialize user called.');
		connectionMySQL.query("select * from Users where Users.id = "+id, function(err,rows){	
			done(err, rows[0]);
		});
    });

    passport.use('local', new LocalStratagy({
        username: 'username',
        password: 'password',
        passReqToCallback: true
    },
    function(req, username, password, done){
        connectionMySQL.query("SELECT * FROM Users WHERE Users.nickName = '"+username+"'", function(err, rows){
            if (err)
                return done(err);
			 if (!rows.length) {
                return done(null, false, req.flash('loginMessage', 'No user found.')); 
            } 			
            if (!( rows[0].password == password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
			
            return done(null, rows[0]);	
        });
    }
));

    let isExists = function(massQueries, _outPutTextOfError, partOfFunction, indexX){
        return new Promise( function(resolve, reject){
            if (indexX === undefined) {
                indexX = 0;
            }            
            let query = massQueries[indexX].query;
            connectionMySQL.query(query, async function(err, rows,fields){
                if(err){
                    console.log("Error in query : " + massQueries[indexX].query);
                    console.log("------------QUERY ENDED WITH ERROR------------");
                    //reject(404);
                }
                else {
                    if(rows[0].isNotEmpty == 1){
                        console.log("Query of validation " + (indexX + 1) + " success");
                        let _outPutTextOrDataOfSuccess = "успех";
                            let changeIndex = ++indexX      
                            if(changeIndex != massQueries.length){
                                // тут работают валидации
                                for (let index = changeIndex; index < massQueries.length; ++index) {
                                    _outPutTextOrDataOfSuccess = await isExists(massQueries, massQueries[index].error, partOfFunction, index);
                                }
                            }      
                            else{
                                //тут код работает только когда обработаны все валидации
                                let _outPutTextOrDataOfSuccess = await UsuallFunction(query, "Ошибка в UsuallFunction", partOfFunction);
                                resolve(_outPutTextOrDataOfSuccess);
                            }                                      
                        resolve(_outPutTextOrDataOfSuccess);
                        console.log("------------QUERY ENDED WITH SUCCESS------------");
                    }
                    else{
                        console.log(massQueries[indexX].error);
                        resolve(massQueries[indexX].error);
                        console.log("------------QUERY ENDED WITH ERROR------------");
                    }
                }
            });
        });
    };

    let UsuallFunction = function(_query, _outPutTextOfError, partOfFunction){
        return new Promise(function(resolve, reject){
            let query = _query;
            connectionMySQL.query(query, function(err, rows,fields){
                if(err){
                    console.log("Error in query : " + _query);
                    reject(404);
                }
                else {
                    console.log("Successful UsuallFunction");  
                    let _outPutTextOrDataOfSuccess = partOfFunction();
                    resolve(_outPutTextOrDataOfSuccess);
                }
            });
        });
    };

    this.FindInfoAboutBook = function(_idBook){
        return new Promise(async function(resolve, reject){            
            let FindBookFunc = function(){
                return new Promise(function(resolve, reject){
                        let query = "SELECT Users.nickName, Books.Title, Books.idBook FROM Users JOIN BooksUsers ON BooksUsers.id_user = Users.id JOIN Books on Books.idBook = BooksUsers.id_book";
                        connectionMySQL.query(query, function(err, rows, fields){
                        if(err){
                            console.log("Error in query");
                        }
                        else {
                            console.log("Successful query");
                            let massBooks = [];
                            for(var index in rows){
                                var obj = {
                                    id: rows[index].idBook,
                                    title: rows[index].Title,
                                    owner: rows[index].nickName
                                }
                                if(_idBook == obj.id){
                                    massBooks.push(obj);
                                }
                            }
                            resolve(massBooks);
                        }
                    });
                });                    
            }
            let query1 = {
                query:"SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"",
                error: "Book is not found"
            }
            let massQ = [query1];
            let result = isExists(massQ, "Book is not found", FindBookFunc);
            resolve(result);
        });        
    };   

    this.FindUsers = function(_idUser){
        return new Promise(function(resolve, reject){

            let FindAllUsers = function(){
                return new Promise(function(resolve, reject){
                    let query1 = "SELECT * FROM `Users` WHERE `id` = '"+_idUser+"' ";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            reject(404);
                        }
                        else {
                            if(rows[0].isAdmin == 1){
                                let query2 = "SELECT * FROM `Users`";
                                connectionMySQL.query(query2, function(err, rows, fields){
                                    if(err){
                                        console.log("Error in query2");
                                        reject(404);
                                    }
                                    else {
                                        let massAllUsers = [];
                                        for(var index in rows){
                                            var obj = {
                                                idUser: rows[index].id,
                                                nickName: rows[index].nickName
                                            }                        
                                            massAllUsers.push(obj);
                                        }
                                        resolve(massAllUsers);
                                    }
                                });
                            }
                            else {
                                resolve("User does not have access");
                            }
                        }
                    });
                });
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `id` = '"+_idUser+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", FindAllUsers);
            resolve(result);
        });
    }

    this.DeleteUser = function(_nickName){
        return new Promise(function(resolve, reject){

            let DeleteThisUser = function(){
                return new Promise(function(resolve, reject){
                    let query1 = "DELETE FROM `summerpractice`.`Users` WHERE `Users`.`nickName` = '"+_nickName+"' ";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            reject(404);
                        } else {
                            resolve("User is deleted");
                        }
                    });
                });
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `nickName` = '"+_nickName+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not delete the user", DeleteThisUser);
            resolve(result);
        });        
    }

    this.FindBooks = function(_idUser){
        return new Promise(function(resolve, reject){

            let FindBooksForHeader = function(){
                return new Promise(function(resolve, reject){
                    let query1 = "SELECT * FROM `Users` WHERE `id` = '"+_idUser+"' ";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            reject(404);
                        }
                        else {
                            if(rows[0].isAdmin == 1){
                                let query2 = "SELECT * FROM `Books` INNER JOIN Users ON Books.CurrentOwner = Users.id ";
                                connectionMySQL.query(query2, function(err, rows, fields){
                                    if(err){
                                        console.log("Error in query2, Admin");
                                        reject(404);
                                    }
                                    else{
                                        let massAllBooks = [];
                                        for(var index in rows){
                                            var obj = {
                                                idBook: rows[index].idBook,
                                                Title: rows[index].Title,
                                                CurrentOwner: rows[index].CurrentOwner,
                                                nickName: rows[index].nickName
                                            }                        
                                            massAllBooks.push(obj);
                                        }
                                        let massResult = [];
                                        massResult.push(massAllBooks);
                                        massResult.push("Admin");
                                        resolve(massResult);
                                    }                                
                                });
                            }
                            else {
                                let query2 = "SELECT * FROM `BooksUsers` WHERE `id_user` = '"+_idUser+"' AND `Is_Owner` = '1' ";
                                connectionMySQL.query(query2, function(err, rows, fields){
                                    if(err){
                                        console.log("Error in query2, Non-Admin");
                                        reject(404);
                                    }
                                    else {
                                        let massOwnBooks = [];
                                        for(var index in rows){
                                            var obj = {
                                                id: rows[index].id,
                                                id_user: rows[index].id_user,
                                                id_book: rows[index].id_book,
                                                Is_Owner: rows[index].Is_Owner
                                            }                        
                                            massOwnBooks.push(obj);
                                        }
                                        console.log(massOwnBooks);
                                        let query3 = "SELECT * FROM `BooksUsers`";
                                        connectionMySQL.query(query3, function(err, rows, fields){
                                            if(err){
                                                console.log("Error in query3, Non-Admin");
                                                reject(404);
                                            }
                                            else {
                                                let massGrantedBooks = [];
                                                for(let i = 0; i < massOwnBooks.length; i++){
                                                    for(let j = 0; j < rows.length; j++){
                                                        if( (massOwnBooks[i].id_book == rows[j].id_book)
                                                            && (rows[j].Is_Owner == 0)){
                                                                var obj = {
                                                                    id: rows[j].id,
                                                                    id_user: rows[j].id_user,
                                                                    id_book: rows[j].id_book,
                                                                    Can_Edit: rows[j].Can_Edit,
                                                                    Can_Watch: rows[j].Can_Watch,
                                                                    Is_Owner: rows[j].Is_Owner
                                                                }                        
                                                                massGrantedBooks.push(obj);                                                            
                                                        }
                                                    }
                                                }

                                                let query4 = "SELECT BooksUsers.id ,BooksUsers.id_user, BooksUsers.id_book, BooksUsers.Can_Edit, BooksUsers.Can_Watch, BooksUsers.Is_Owner, Books.Title, Users.nickName FROM `BooksUsers` INNER JOIN Books ON Books.idBook = BooksUsers.id_book INNER JOIN Users ON Users.id = BooksUsers.id_user "
                                                connectionMySQL.query(query4, function(err, rows, fields){
                                                    if(err){
                                                        console.log("Error in query4, Non-Admin");
                                                        reject(404);
                                                    }
                                                    else {
                                                        let massBooksWithInfo = [];
                                                        for(let i = 0; i < massGrantedBooks.length; i++){
                                                            for(let j = 0; j < rows.length; j++){
                                                                if( (massGrantedBooks[i].id == rows[j].id) ){
                                                                        var obj = {
                                                                            id: rows[j].id,
                                                                            id_user: rows[j].id_user,
                                                                            id_book: rows[j].id_book,
                                                                            Can_Edit: rows[j].Can_Edit,
                                                                            Can_Watch: rows[j].Can_Watch,
                                                                            Is_Owner: rows[j].Is_Owner,
                                                                            Title: rows[j].Title,
                                                                            nickName: rows[j].nickName
                                                                        }                        
                                                                        massBooksWithInfo.push(obj);                                                            
                                                                }
                                                            }
                                                        }
                                                        let massResult = [];
                                                        massResult.push(massBooksWithInfo);
                                                        massResult.push('NonAdmin');
                                                        resolve(massResult);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
    
                        }
                    });
                });
            }
            
            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `id` = '"+_idUser+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", FindBooksForHeader);
            resolve(result);
        });
    };

    this.FindBooksOfCurrentUser = function(_idUser){
        return new Promise(function (resolve, reject){

            let FindBooks = function(){
                return new Promise(function(resolve, reject){
                    let query1 = "SELECT * FROM `Books` WHERE `CurrentOwner` = '"+_idUser+"'";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            reject(404);
                        }
                        else{
                            console.log("Successful query");
                            let massBooks = [];
                            for(var index in rows){
                                massBooks.push(rows[index]);
                            }  
                            if(massBooks.length === 0){
                                resolve("User does not have books");
                            }        
                            else{
                                resolve(massBooks);
                            }                   
                        }
                    });
                })
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `id` = '"+_idUser+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", FindBooks);
            resolve(result);
        });
    }

    this.ToManageAccess = function(_nickNameUserToGrant, _bookTitle, _numberOfAccess){
        return new Promise(function(resolve, reject){

            let ControlAccess = function(){
                return new Promise(function(resolve, reject){

                    let query1 = "SELECT * FROM `Books` WHERE `Title` LIKE '"+_bookTitle+"' ";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            reject(404);
                        }
                        else {
                            let bookId = rows[0].idBook;
                            
                            let query2 = "SELECT * FROM `Users` WHERE `nickName` LIKE '"+_nickNameUserToGrant+"' ";
                            connectionMySQL.query(query2, function(err, rows, fields){
                                if(err){
                                    console.log("Error in query2");
                                    reject(404);
                                }
                                else {
                                    let userToGrantId = rows[0].id;

                                    query3 = "SELECT EXISTS (SELECT * FROM `BooksUsers` WHERE `id_user` = '"+userToGrantId+"' AND `id_book` = '"+bookId+"') AS \"Exist\" "
                                    connectionMySQL.query(query3, function(err, rows, fields){
                                        if(err){
                                            console.log("Error in query3");
                                            reject(404);
                                        }
                                        else {
                                            console.log(rows);
                                            let query4;
                                            if(rows[0].Exist == 1){
                                                switch(_numberOfAccess){
                                                    case 'readOnly': {
                                                        query4 = "UPDATE `BooksUsers` SET `Can_Edit`= '0' , `Can_Watch`='1',`Is_Owner`='0' WHERE `id_user` = '"+userToGrantId+"' AND `id_book` = '"+bookId+"' ;";
                                                        break;
                                                    }
                                                    case 'readAndEdit': {
                                                        query4 = "UPDATE `BooksUsers` SET `Can_Edit`= '1' , `Can_Watch`='1',`Is_Owner`='0' WHERE `id_user` = '"+userToGrantId+"' AND `id_book` = '"+bookId+"' ;";
                                                        break;
                                                    }
                                                    case 'limitAccess': {                                                        
                                                        query4 = "DELETE FROM `summerpractice`.`BooksUsers` WHERE `id_user` = '"+userToGrantId+"' AND `id_book` = '"+bookId+"' ;";
                                                        break;
                                                    }
                                                }
                                            } else {
                                                switch(_numberOfAccess){
                                                    case 'readOnly': {
                                                        query4 = "INSERT INTO `summerpractice`.`BooksUsers` (`id_user`, `id_book`, `Can_Edit`, `Can_Watch`, `Is_Owner`) VALUES ('"+userToGrantId+"', '"+bookId+"', '0', '1', '0');";
                                                        break;
                                                    }
                                                    case 'readAndEdit': {
                                                        query4 = "INSERT INTO `summerpractice`.`BooksUsers` (`id_user`, `id_book`, `Can_Edit`, `Can_Watch`, `Is_Owner`) VALUES ('"+userToGrantId+"', '"+bookId+"', '1', '1', '0');";
                                                        break;
                                                    }
                                                    case 'limitAccess': {
                                                        query4 = "INSERT INTO `summerpractice`.`BooksUsers` (`id_user`, `id_book`, `Can_Edit`, `Can_Watch`, `Is_Owner`) VALUES ('"+userToGrantId+"', '"+bookId+"', '0', '0', '0');";
                                                        break;
                                                    }
                                                }                                                
                                            }

                                            connectionMySQL.query(query4, function(err, rows, fields){
                                                if(err){
                                                    console.log("Error in query4");
                                                    reject(404);
                                                }
                                                else {
                                                    console.log("Access is given");
                                                    resolve("Success");
                                                }
                                            });
                                        }                                        
                                    });
                                    
                                }
                            });
                        }
                    });
                });
            }
            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `nickName` = '"+_nickNameUserToGrant+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", ControlAccess);
            resolve(result);
        });        
    }

    this.CheckPrivacy = function(_idUser){
        return new Promise(function(resolve, reject){

            let CheckBooks = function(){
                return new Promise(function(resolve, reject){
                    let query1 = "SELECT * FROM `BooksUsers` WHERE `id_user` = '"+_idUser+"' ";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query2");
                            reject(404);
                        }
                        else{
                            let massResult = [];
                            let massBooksOfUser = [];
                            let massBooksOfGrantedOnlyRead = [];
                            let massBooksOfGrantedReadAndEdit = [];
                            for(var index in rows){
                                if(rows[index].Is_Owner == 1){  
                                    massBooksOfUser.push(rows[index]);
                                }
                                if(rows[index].Can_Edit == 1){
                                    massBooksOfGrantedReadAndEdit.push(rows[index]);
                                }
                                if((rows[index].Can_Watch == 1) && (rows[index].Can_Edit == 0)){
                                    massBooksOfGrantedOnlyRead.push(rows[index]);
                                }
                            }

                            let query2 = "SELECT * FROM `Books`";
                            connectionMySQL.query(query2, function(err, rows, fields){
                                if(err){
                                    console.log("Error in query2");
                                    reject(404);
                                }
                                else{
                                    let massOwnBooks = [];
                                    for(var index in rows){
                                        massBooksOfUser.forEach(element => {
                                            if(rows[index].idBook == element.id_book){
                                                massOwnBooks.push(rows[index]);
                                            }
                                        });
                                    }

                                    let massGrantedBooksEdit = [];
                                    for(var index in rows){
                                        massBooksOfGrantedReadAndEdit.forEach(element => {
                                            if( (rows[index].idBook == element.id_book) && 
                                                (rows[index].CurrentOwner != _idUser) ){
                                                massGrantedBooksEdit.push(rows[index]);
                                            }
                                        });
                                    }

                                    let massGrantedBooksRead = [];
                                    for(var index in rows){
                                        massBooksOfGrantedOnlyRead.forEach(element => {
                                            if( (rows[index].idBook == element.id_book) && 
                                            (rows[index].CurrentOwner != _idUser) ){
                                                massGrantedBooksRead.push(rows[index]);
                                            }
                                        });
                                    }

                                    massResult.push(massOwnBooks);
                                    massResult.push(massGrantedBooksEdit);
                                    massResult.push(massGrantedBooksRead);

                                    resolve(massResult);                                                    
                                }
                            });
                        }
                    });
                });
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `id` = '"+_idUser+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", CheckBooks);
            resolve(result);
        });
    }

    this.CheckUserAdmin = function(_idUser){
        return new Promise(function(resolve, reject){

            let CheckAdmin = function(){
                return new Promise(function(resolve, reject){
                    query = "SELECT * FROM `Users` WHERE `id` = '"+_idUser+"' ";
                    connectionMySQL.query(query, function(err, rows, fields){
                        if(err){
                            console.log("Error in query");
                            reject(404);
                        }
                        else {
                            if(rows[0].isAdmin == 1){
                                resolve("Admin");
                            } else {
                                resolve("NonAdmin");
                            }
                        }
                    });
                });                
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE `id` = '"+_idUser+"') AS \"isNotEmpty\"",
                error: "User is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Can not find any books", CheckAdmin);
            resolve(result);
        });
    }

    this.FindNotesInBook = function(_idBook){
        return new Promise(function(resolve, reject){

            let FindNotes = function(){
                return new Promise(function(resolve, reject){
                    let query2 = "SELECT * FROM `BooksUsers` WHERE `id_user` = '"+_idBook+"' ";
                    connectionMySQL.query(query2, function(err, rows, fields){
                        if(err){
                            console.log("Error in query2");
                            reject(404);
                        }
                        else{                         
                            
                            let query3 = "SELECT Books.idBook, Books.Title, Notes.idNote, Notes.Note FROM Books JOIN NotesInBooks ON NotesInBooks.id_book = Books.idBook JOIN Notes ON Notes.idNote = NotesInBooks.id_note WHERE Books.idBook = " + _idBook;
                            connectionMySQL.query(query3, function(err, rows, fields){
                                if(err){
                                    console.log("Error in query3");
                                    reject(404);
                                } else {
                                    console.log("Successful query");  
                                    let massNotes = [];
                                    for(var index in rows){
                                        var obj = {
                                            idBook: rows[index].idBook,
                                            idNote: rows[index].idNote,
                                            title: rows[index].Title,
                                            note: rows[index].Note
                                        }                        
                                        massNotes.push(obj);
                                    }       
                                    if(massNotes.length === 0){
                                        resolve("Book is empty");
                                    }        
                                    else{
                                        resolve(massNotes);
                                    } 
                                }
                            });                                              
                        }
                    });
                });                
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"",
                error: "Book is not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Book is not found", FindNotes);
            resolve(result);
        });
    }     

    this.FindNoteInBook = function(_idBook, _idNote){
        return new Promise( async function(resolve, reject){

            let FindNoteInBook = function(){
                return new Promise(function(resolve, reject){
                    let query3 = "SELECT Books.idBook, Notes.Note FROM Notes JOIN NotesInBooks on NotesInBooks.id_note = Notes.idNote JOIN Books on Books.idBook = NotesInBooks.id_book WHERE Books.idBook = " + _idBook + " AND Notes.idNote = " + _idNote;
                                    
                    connectionMySQL.query(query3, function(err, rows, fields){
                        if(err){
                            console.log("Error in query3");
                        }
                        else{
                            console.log("Successful query");  
                            let massNotes = [];                 //поменять на change
                            for(var index in rows){
                                var obj = {
                                    idBook: rows[index].idBook,
                                    note: rows[index].Note
                                }                        
                                massNotes.push(obj);
                            }       
                            if(massNotes.length === 0){
                                console.log("Book is empty");
                                resolve("Book is empty");
                            }        
                            else{
                                resolve(massNotes);
                            }                                                
                        }
                    });
                });
            }
            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"",
                error: "Book is not found"
            }
            let query2 = {
                query: "SELECT EXISTS(SELECT * FROM Notes WHERE Notes.idNote = " + _idNote + ") AS \"isNotEmpty\"",
                error: "Note is not found"
            }                    
            let massQueries = [query1, query2];
            let result = isExists(massQueries, "Book is empty", FindNoteInBook);
            resolve(result);
        });        
    }    

    this.CreateNoteInBook = function(_idBook, _note){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1, function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else {
                    if(rows[0].isNotEmpty == 1){
                        let query2 = "INSERT INTO `Notes` (`IdNote`, `id_book`, `Note`) VALUES (NULL, '" + _idBook + "', '"+ _note + "');"
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                                reject(404);
                            }
                            else {
                                let createdId = rows.insertId;
                                let query3 = "INSERT INTO `NotesInBooks` (`id`, `id_book`, `id_note`) VALUES (NULL, '" + _idBook + "', '"+ createdId + "');"
                                connectionMySQL.query(query3, function(err, rows, fields){
                                    if(err){
                                        console.log("Error in query3");
                                    }
                                    else {
                                        console.log("Note is created in both tables");
                                        resolve(createdId);
                                    }
                                });
                                //resolve("Notes is created");
                            }
                        });
                    }
                    else {
                        resolve("Book is not found");
                    }
                }
            });            
        });
    }

    this.ChangeNoteInBook = function(_idBook, _idNote, _newNote){
        return new Promise(function(resolve, reject){

            let ChangeNote = function(){
                return new Promise(function(resolve, reject){
                    let query3 = "UPDATE `summerpractice`.`Notes` SET `Note` = '" + _newNote + "' WHERE `Notes`.`IdNote` = " + _idNote + ";"
                    connectionMySQL.query(query3, function(err, rows, fields){
                        if(err){
                            console.log("Error in query3");
                        }
                        else {
                            console.log("Successful query");  
                            resolve("Note is changed");
                        }
                    });
                });
            };
        

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"",
                error: "Book is not found"
            }
            let query2 = {
                query: "SELECT EXISTS(SELECT * FROM Notes WHERE Notes.idNote = " + _idNote + ") AS \"isNotEmpty\"",
                error: "Note is not found"
            }                    
            let massQueries = [query1, query2];
            let result = isExists(massQueries, "Note is not changed", ChangeNote);
            resolve(result);
        });
    }

    this.DeleteNoteInBook = function(_idBook, _idNote){
        return new Promise(function(resolve, reject){

            let DeleteNote = function() {
                return new Promise(function(resolve, reject){
                    let query2 = "SELECT EXISTS(SELECT * FROM Notes WHERE Notes.idNote = " + _idNote + ") AS \"isNotEmpty\"";
                    connectionMySQL.query(query2, function(err, rows, fields){
                        if(err){
                            console.log("Error in query2");
                        }
                        else{
                            if(rows[0].isNotEmpty == 1){
                                query3 = "DELETE FROM `summerpractice`.`Notes` WHERE `Notes`.`IdNote` = " + _idNote;
                                query4 = "DELETE FROM `summerpractice`.`NotesInBooks` WHERE `NotesInBooks`.`id_note` = " + _idNote;
                                connectionMySQL.query(query3, function(err, rows, fields){
                                    if(err){
                                        console.log("Error in query3");
                                    }
                                    else{
                                        console.log("The note is deleted");  
                                        resolve("Note is deleted");
                                    }
                                });
                            }
                            else {
                                resolve("Note is not found");
                            }
                        }
                    });         
                });
            }

            let query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"",
                error: "Book is not found"
            }                     
            let massQueries = [query1];
            let result = isExists(massQueries, "Book is not found", DeleteNote);
            resolve(result);
        });
    }

    this.CreateUser = function(_login, _password, _adminAccess){
        return new Promise(function(resolve, reject){

            let CreateUser = function(){
                return new Promise(function(resolve, reject){
                    let query;
                    if(_adminAccess == "adminAccess"){
                        query = "INSERT INTO `summerpractice`.`Users` (`nickName`, `password`, `isAdmin`) VALUES ('"+_login+"', '"+_password+"', '1');"
                    } else {
                        console.log(_adminAccess);
                        query = "INSERT INTO `summerpractice`.`Users` (`nickName`, `password`, `isAdmin`) VALUES ('"+_login+"', '"+_password+"', NULL);"
                    }
                    connectionMySQL.query(query, function(err, rows, fields){
                        if(err){
                            console.log("Error in query2");
                        }
                        else {
                            resolve("Пользователь зарегестрирован");
                        }
                    });
                });
            }
            query1 = {
                query: "SELECT NOT EXISTS(SELECT * FROM `Users` WHERE nickName = '"+_login+"' or password = '"+_password+"') AS \"isNotEmpty\"",
                error: "Loggin or password have already created"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "User is not created", CreateUser);
            resolve(result);
        });
    }

    this.FindUser = function(_login, _password){
        return new Promise(function(resolve, reject){

            let FindUser = function(){
                return new Promise( function(resolve, reject){
                    let query = "SELECT * FROM `Users` WHERE Users.nickName = '"+_login+"' AND Users.password = '"+_password+"' ";
                    connectionMySQL.query(query, function(err, rows, fields){
                        if(err){
                            console.log("Error in query2");
                        }
                        else {
                            console.log("Successful query");
                            obj = {
                                id: rows[0].id,
                                login: rows[0].nickName,
                                password: rows[0].password 
                            }
                            resolve(obj);
                        }
                    });
                });
            }
            query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Users` WHERE nickName = '"+_login+"' AND password = '"+_password+"') AS \"isNotEmpty\"",
                error: "Incorrect login/password or user is not created"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "User is not found", FindUser);
            resolve(result);
        });
    }

    this.CreateBook = function(_userId, _bookTitle){
        return new Promise(function(resolve, reject){
            
            let CreateBook = function(){
                return new Promise(function(resolve, reject){
                    query1 = "INSERT INTO `summerpractice`.`Books` (`Title`, `CurrentOwner`) VALUES ('"+_bookTitle+"', '"+_userId+"')";
                    connectionMySQL.query(query1, function(err, rows, fields){
                        if(err){
                            console.log("Error in query1");
                            resolve("Книга не создана");
                        }
                        else {
                            query2 = "SELECT * FROM `Books` WHERE `Title` LIKE '"+_bookTitle+"' ";
                            connectionMySQL.query(query2, function(err, rows, fields){
                                if(err){
                                    console.log("Error in query2");
                                    resolve("Книга создана");
                                }
                                else {
                                    let bookId = rows[0].idBook
                                    query3 = "INSERT INTO `summerpractice`.`BooksUsers` (`id_user`, `id_book`, `Can_Edit`, `Can_Watch`, `Is_Owner`) VALUES ('"+_userId+"', '"+bookId+"', '1', '1', '1');";
                                    connectionMySQL.query(query3, function(err, rows, fields){
                                        if(err){
                                            console.log("Error in query3");
                                            resolve("Книга не создана");
                                        }
                                        else {
                                            resolve("Книга создана");
                                        }
                                    });
                                }
                            });              
                        }
                    });
                });
            }

            query1 = {
                query: "SELECT EXISTS(SELECT * FROM `Books`) AS \"isNotEmpty\"",                
                error: "Books are not found"
            }
            let massQueries = [query1];
            let result = isExists(massQueries, "Book is not created", CreateBook);
            resolve(result);
        });
    }

//==========================================================================================
//==========================================================================================
//==========================================================================================


    //не используется, но как пример того, если не использовать промисы
    this.FindNoteInTmpBook = function(_idBook, _idNote){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1,function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else{
                    if(rows[0].isNotEmpty == 1){
                        let query2 = "SELECT EXISTS(SELECT * FROM OnlyOneNotes WHERE OnlyOneNotes.idNote = " + _idNote + ") AS \"isNotEmpty\"";
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                            }
                            else{
                                if(rows[0].isNotEmpty == 1){
                                    let query3 = "SELECT Books.idBook, OnlyOneNotes.Note FROM OnlyOneNotes JOIN NotesInBooksTMP on NotesInBooksTMP.id_note = OnlyOneNotes.idNote JOIN Books on Books.idBook = NotesInBooksTMP.id_book WHERE Books.idBook = " + _idBook + " AND OnlyOneNotes.idNote = " + _idNote;
                                    
                                    connectionMySQL.query(query3, function(err, rows, fields){
                                        if(err){
                                            console.log("Error in query3");
                                        }
                                        else{
                                            console.log("Successful query");  
                                            let massNotes = [];                 //поменять на change
                                            for(var index in rows){
                                                var obj = {
                                                    idBook: rows[index].idBook,
                                                    note: rows[index].Note
                                                }                        
                                                massNotes.push(obj);
                                            }       
                                            if(massNotes.length === 0){
                                                resolve("Book is empty");
                                            }        
                                            else{
                                                resolve(massNotes);
                                            }                                                
                                        }
                                    });
                                }
                                else {
                                    resolve("Note is not found");
                                }
                            }
                        });                        
                    }
                    else{
                        resolve("Book is not found");
                    }
                }
            });
        });
    }

    // Больше не используется
    this.FindNotesInTMPBook = function(_idBook){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1,function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else {                    
                    if(rows[0].isNotEmpty == 1) {
                        let query2 = "SELECT Books.idBook, Books.Title, OnlyOneNotes.idNote, OnlyOneNotes.Note FROM Books JOIN NotesInBooksTMP ON NotesInBooksTMP.id_book = Books.idBook JOIN OnlyOneNotes ON OnlyOneNotes.idNote = NotesInBooksTMP.id_note WHERE Books.idBook = " + _idBook;
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                                reject(404);
                            }
                            else{
                                console.log("Successful query");  
                                let massNotes = [];
                                for(var index in rows){
                                    var obj = {
                                        idBook: rows[index].idBook,
                                        idNote: rows[index].idNote,
                                        title: rows[index].Title,
                                        note: rows[index].Note
                                    }                        
                                    massNotes.push(obj);
                                }       
                                if(massNotes.length === 0){
                                    resolve("Book is empty");
                                }        
                                else{
                                    resolve(massNotes);
                                }                   
                            }
                        });
                    }
                    else{
                        resolve("The book is not found");
                    }
                }
            });            
        });
    };

    this.OldFindNotesInBook = function(_idBook){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1,function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else {                    
                    if(rows[0].isNotEmpty == 1) {
                        let query2 = "SELECT Books.idBook, Books.Title, Notes.id, Notes.Note FROM Books JOIN NotesInBooks ON NotesInBooks.id_book = Books.idBook JOIN Notes ON Notes.id = NotesInBooks.id_note WHERE Books.idBook = " + _idBook;
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                                reject(404);
                            }
                            else{
                                console.log("Successful query");  
                                let massNotes = [];
                                for(var index in rows){
                                    var obj = {
                                        idBook: rows[index].idBook,
                                        idNote: rows[index].id,
                                        title: rows[index].Title,
                                        note: rows[index].Note
                                    }                        
                                    massNotes.push(obj);
                                }       
                                if(massNotes.length === 0){
                                    resolve("Book is empty");
                                }        
                                else{
                                    resolve(massNotes);
                                }                   
                            }
                        });
                    }
                    else{
                        resolve("The book is not found");
                    }
                }
            });            
        });
    };   

    //не используется
    this.OldFindNoteInBook = function(_idBook, _idNote){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1,function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else{
                    if(rows[0].isNotEmpty == 1){
                        let query2 = "SELECT EXISTS(SELECT * FROM Notes WHERE Notes.id = " + _idNote + ") AS \"isNotEmpty\"";
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                            }
                            else{
                                if(rows[0].isNotEmpty == 1){
                                    let query3 = "SELECT Books.idBook, Notes.Note FROM Notes JOIN NotesInBooks on NotesInBooks.id_note = Notes.id JOIN Books on Books.idBook = NotesInBooks.id_book WHERE Books.idBook = " + _idBook + " AND Notes.id = " + _idNote;
                                    
                                    connectionMySQL.query(query3, function(err, rows, fields){
                                        if(err){
                                            console.log("Error in query3");
                                        }
                                        else{
                                            console.log("Successful query");  
                                            let massNotes = [];                 //поменять на change
                                            for(var index in rows){
                                                var obj = {
                                                    idBook: rows[index].idBook,
                                                    note: rows[index].Note
                                                }                        
                                                massNotes.push(obj);
                                            }       
                                            if(massNotes.length === 0){
                                                resolve("Book is empty");
                                            }        
                                            else{
                                                resolve(massNotes);
                                            }                                                
                                        }
                                    });
                                }
                                else {
                                    resolve("Note is not found");
                                }
                            }
                        });                        
                    }
                    else{
                        resolve("Book is not found");
                    }
                }
            });

        });
    }

    //можно удалить
    this.OldDeleteNoteInBook = function(_idBook, _idNote){
        return new Promise(function(resolve, reject){
            let query1 = "SELECT EXISTS(SELECT * FROM `Books` WHERE Books.idBook = " + _idBook + ") AS \"isNotEmpty\"";
            connectionMySQL.query(query1,function(err, rows, fields){
                if(err){
                    console.log("Error in query1");
                }
                else{
                    if(rows[0].isNotEmpty == 1){
                        let query2 = "SELECT EXISTS(SELECT * FROM OnlyOneNotes WHERE OnlyOneNotes.idNote = " + _idNote + ") AS \"isNotEmpty\"";
                        connectionMySQL.query(query2, function(err, rows, fields){
                            if(err){
                                console.log("Error in query2");
                            }
                            else{
                                if(rows[0].isNotEmpty == 1){
                                    query3 = "DELETE FROM `summerpractice`.`OnlyOneNotes` WHERE `OnlyOneNotes`.`IdNote` = " + _idNote;
                                    query4 = "DELETE FROM `summerpractice`.`NotesInBooksTMP` WHERE `NotesInBooksTMP`.`id_note` = " + _idNote;

                                    connectionMySQL.query(query3, function(err, rows, fields){
                                        if(err){
                                            console.log("Error in query3");
                                        }
                                        else{
                                            console.log("The note is deleted");  
                                            resolve("Note is deleted");
                                        }
                                    });
                                }
                                else {
                                    resolve("Note is not found");
                                }
                            }
                        });                        
                    }
                    else{
                        resolve("Book is not found");
                    }
                }
            });
        });                        
    }
    
    this.FindUserss = function(){        
        return new Promise(function(resolve, reject){
            connectionMySQL.query("SELECT * FROM Users", function(err, rows, fields){
                if(err){
                    console.log("Error in query");
                    reject(404);
                }
                else {
                    console.log("Successful query");  
                    let massBooks = [];
                    for(var index in rows){
                        var obj = {
                            id: rows[index].idBook,
                            title: rows[index].Title,
                            owner: rows[index].nickName
                        }
                        massBooks.push(obj);
                    }  
                    resolve(massBooks);
                }            
            });
        });
    };    
}

module.exports = databaseFunctions;
