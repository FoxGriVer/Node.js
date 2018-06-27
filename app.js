var express = require("express");
var expressLayouts = require('express-ejs-layouts');
var partials = require('express-partials');
var fs = require("fs");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var app = express();

var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var dataJSON = fs.readFileSync('data/users.json');
var data = JSON.parse(dataJSON);

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');
app.use(partials());
app.use(expressLayouts);
app.set("views","./views");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
     secret: 'keyboard cat',
     resave: true, 
     saveUninitialized:true,
     cookie: { maxAge: 300000, secure: false }
    }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var jsonParser = bodyParser.json();
var urlParser = bodyParser.urlencoded({extended: false});

var databaseFunctions = require('./data/databaseFunctions');
var database = new databaseFunctions(passport);

app.get('/mainPage', function(req, res){
    if(!data) return res.sendStatus(400);
    console.log(req.isAuthenticated());
    res.render("mainPage",{});
});

app.get('/cookie', function(req, res){
    res.cookie('myfirst',"loocks");
    console.log(req.cookies);
    console.log(req.session);
});

app.get('/getUsers', function(req, res){
    if(!data) return res.sendStatus(400);
    
    let GetUsers = async() => {
        let firstResponse = await database.FindUsers();
        let secondRequest = await res.send(firstResponse);
    }    
    GetUsers();
});

app.get('/users', requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let GetUsers = async() => {
        let firstResponse = await database.FindUsers(req.user.id);
        if(firstResponse == "User does not have access")
        {
            res.render('Header/AccessDenied', {});
        } else {
            res.render('Header/AdminUsers', {
                allUsers: firstResponse
            });
        }        
    }    
    GetUsers();
})

app.get('/books', requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let GetBooks = async() => {
        let firstResponse = await database.FindBooks(req.user.id);
        if(firstResponse[1] == "Admin"){
            res.render("Header/AllBooks", {
                AllBooks: firstResponse[0]
            });
        } else {
            res.render("Header/GrantedAccessToBooks", {
                GrantedBooks: firstResponse[0]
            });
        }             
    }
    GetBooks();
});

app.get('/getInfoAboutBook/:idBook', function(req, res){
    if(!data) return res.sendStatus(400);

    let GetBook = async() => {
        let firstResponse = await database.FindInfoAboutBook(req.params.idBook);
        if(firstResponse == "Book is not found") return res.send("Такой книги не существует");
        console.log(firstResponse);
        await res.send(firstResponse);
    }
    GetBook();        
});

app.get('/getBooks', function(req, res){
    if(!data) return res.sendStatus(400);

    let GetBooks = async() => {
        let firstResponse = await database.FindBooks();
        let secondRequest = await res.send(firstResponse);
    }
    GetBooks();
});

app.get('/getBooksOfCurrentUser',requireLogin, function(req,res){
    if(!data) return res.sendStatus(400);

    let GetBooks = async() => {
        let firstResponse = await database.CheckPrivacy(req.user.id);      
        if(firstResponse == "User does not have books") 
            return res.send("User does not have books");
        await res.render("User/BooksList", {
            OwnBooks: firstResponse[0],
            ReadAndEditBooks: firstResponse[1],
            ReadOnlyBooks: firstResponse[2]
        });
    }
    GetBooks();
});

app.get('/createBook',requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let CreateBook = async() => {

        await res.render("User/CreateBook", {
            user: req.user
        });
    }
    CreateBook();    
});

app.post('/createBook', urlParser, requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let CreateBook = async() => {
        let firstResponse = await database.CreateBook(req.body.idUser, req.body.BookTitle);
        if(firstResponse == "Книга не создана" ) return res.sendStatus(404);
        let secondRequest = await res.redirect('/profile');
    }
    CreateBook();
});

app.get('/access', requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let GetBooks = async() => {
        let firstResponse = await database.CheckPrivacy(req.user.id);      
        if(firstResponse == "User does not have books") 
            return res.send("User does not have books");
        await res.render("User/Access", {
            OwnBooks: firstResponse[0]
        });        
    }
    GetBooks();
});

app.post('/access', urlParser, requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let ToManageAccess = async() => {
        console.log(req.body); 

        let numberOfAccess;
        switch(req.body.optradio){
            case 'readOnly': {
                numberOfAccess = 'readOnly';
                break;
            }
            case 'readAndEdit': {
                numberOfAccess = 'readAndEdit';
                break;
            }
            case 'limitAccess': {
                numberOfAccess = 'limitAccess';
                break;
            }
        }
        let firstResponse = await database.ToManageAccess(req.body.nickName,
             req.body.selectedBook, numberOfAccess);
        if(firstResponse == "User is not found") 
            return res.render('User/UserToAccessNotFound', {});
        if(firstResponse == "Success") 
            return res.render('User/AccessIsGiven', {});
    }
    ToManageAccess();
});

app.get('/getNoteInBook/:idBook/:idNote', function(req, res){
    if(!data) return res.sendStatus(400);

    let GetNoteInBook = async() => {        
        let firstResponse = await database.FindNoteInBook(req.params.idBook,
             req.params.idNote);
        if(firstResponse == "Book is not found" ||
         firstResponse == "Note is not found") return res.sendStatus(404);
        if(firstResponse == "Book is empty") return res.send("The book is empty");
        let secondRequest = await res.send(firstResponse);
    }
    GetNoteInBook();
});

app.put('/book/:idBook', jsonParser, function(req, res){
    if(!data) return res.sendStatus(400);

    let ChangeNote = async() => {
        let firstResponse = await database.ChangeNoteInBook(req.params.idBook, req.body.idNote, req.body.newNoteText);
        if(firstResponse == "Book is not found" || firstResponse == "Note is not found") return res.sendStatus(404);        
        if(firstResponse == "Note is not changed") return res.send("Note is not changed");
        let changedNote = { 
            idNote: req.body.idNote,           
            newNoteText: req.body.newNoteText
        }       
        res.send(changedNote);
    }
    ChangeNote();
});

app.post('/book/:idBook', jsonParser, function(req, res){
    if(!data) return res.sendStatus(400);
    
    let AddNote = async() => {
        let firstResponse = await database.CreateNoteInBook(req.params.idBook, req.body.noteText);
        if(firstResponse == "Book is not found") return res.send("The book is not found");
        let createdNote = { 
            idNote: firstResponse,           
            noteText: req.body.noteText
        }       
        res.send(createdNote);
    }
    AddNote();
});

app.delete('/book/:idBook/:idNote', function(req, res){
    if(!data) return res.sendStatus(400);

    let DeleteNoteInBook = async() => {
        let firstResponse = await database.DeleteNoteInBook(req.params.idBook, req.params.idNote);
        if(firstResponse == "Book is not found" || firstResponse == "Note is not found") return res.sendStatus(404);        
        res.send(req.params.idNote);
    }

    DeleteNoteInBook();
});

app.get('/book/:idBook', requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);
    
    let GetNotesInBook = async() => {
        let userHasAccess = false;
        let userHasAccessReadOnly = false;         
        let firstResponse = await database.CheckPrivacy(req.user.id);               

        firstResponse[0].forEach(async function(element){
            if(element.idBook == req.params.idBook){
                userHasAccess = true;
            }             
        });
        firstResponse[1].forEach(async function(element){
            if(element.idBook == req.params.idBook){
                userHasAccess = true;
            }             
        });   
        firstResponse[2].forEach(async function(element){
            if(element.idBook == req.params.idBook){
                userHasAccess = true;
                userHasAccessReadOnly = true;
            }             
        });
        
        let isAdmin = await database.CheckUserAdmin(req.user.id);
        console.log(isAdmin);
        if(isAdmin == "Admin"){
            userHasAccess = true;
            userHasAccessReadOnly = false;
        }

        if(userHasAccess){
            let secondRequest = await database.FindNotesInBook(req.params.idBook);
                if(secondRequest == "Book is not found") return res.send("The book is not found");
                if(secondRequest == "Book is empty") return res.render("createNoteInEmptyBook", { idBook : req.params.idBook});                
                if(userHasAccessReadOnly){
                    await res.render("GetNotesInBookReadOnly", {
                        note: secondRequest
                    });
                }
                else{
                    await res.render("getNotesInBook", {
                        note: secondRequest
                    });
                }                              
        }
        else {
            res.render("User/BookIsNotFound",{});
        }        
    }    
    GetNotesInBook();
});

app.get('/createNoteInEmptyBook/:idBook', function(req, res){
    if(!data) return res.sendStatus(400);
    
    res.render("createNote", {
        id: 4
    });
});

app.post('/createNoteInEmptyBook', urlParser, function(req, res){
    if(!data) return res.sendStatus(400);

    let CreateNoteInBook = async() => {
        let firstResponse = await database.CreateNoteInBook(req.body.bookId, req.body.noteText);
        if(firstResponse == "Book is not found") return res.send("The book is not found");
        res.redirect('/book/'+req.body.bookId);
    }
    CreateNoteInBook();
});

app.get('/logIn', function(req, res){
    if(!data) return res.sendStatus(400);

    res.render("logIn",{});
});

app.post('/logIn',    
    passport.authenticate('local', {
        failureRedirect: '/userNotFound',
        failureFlash: true
    }), function(req, res){
        res.redirect('/profile');
    }
);

function requireLogin(req,res,next) {
	if(!req.user) return res.redirect('/userNotFound');
	next();
}

app.get('/userNotFound', function(req, res){
    if(!data) return res.sendStatus(400);

    res.render('User/UserNotFound',{});
});

app.get('/profile', requireLogin, function(req, res){
    res.render('User/Profile', {
        user: req.user
    });
})

app.get('/createUser', function(req, res){
    if(!data) return res.sendStatus(400);

    //res.sendFile(__dirname + '/public/registration.html');
    res.render("registration",{});
});

app.get('/createUserAdmin',requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    res.render("Header/CreateUserAdmin",{});
});

app.post('/createUser', urlParser, function(req, res){
    if(!data) return res.sendStatus(400);

    let CreateUser = async() => {
        let login = req.body.login;
        let password = req.body.password;
        if(login.length > 8 && password.length > 8){            
            let firstResponse = await database.CreateUser(req.body.login, req.body.password, req.body.optradio);
            res.render('Header/UserCreated',{});
        }
        else {
            res.send("Enter more than 8 symbols in login/password");
        }    
    }
    CreateUser();
});

app.get('/deleteUser', requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    res.render("Header/DeleteUser",{});
});

app.post('/deleteUser', urlParser, requireLogin, function(req, res){
    if(!data) return res.sendStatus(400);

    let DeleteUser = async() => {
        let firstResponse = await database.DeleteUser(req.body.nickName);
        if(firstResponse == "User is not found") return res.render('/User/UserNotFound',{});        
        if(firstResponse == "User is deleted") {
            return res.render('Header/UserIsDeleted', {});
        }
    }
    DeleteUser();
});

app.get('/changeNote', function(req, res){
    if(!data) return res.sendStatus(400);

    res.sendFile(__dirname + '/public/changeNote.html');
});

app.post('/changeNote', urlParser, function(req, res){
    if(!data) return res.sendStatus(400);

    let ChangeNote = async() => {
        let firstResponse = await database.ChangeNoteInBook(req.body.idBook, req.body.idNote, req.body.noteText);
        if(firstResponse == "Book is not found" || firstResponse == "Note is not found") return res.sendStatus(404);        
        if(firstResponse == "Note is not changed") return res.send("Note is not changed");
        let changedNote = { 
            idNote: req.body.idNote,           
            newNoteText: req.body.noteText
        }       
        res.send(changedNote);
    }
    ChangeNote();
});

app.listen(3000);
