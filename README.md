# Traningsdaten-Synchronisation

Eine Applikation, die clientseitig die Daten in einer IndexedDB-Datenbank speichert und sich bei Online-Verbindung mit einem Server mit MongoDB synchronisiert.

## Informationen

Diese Anwendung entsteht im Rahmen einer Bachelorarbeit mit dem Thema *Eine Fallstudie zu leistungsbestimmenden Merkmalen browser-basierter Datenbanken*.

## Verwendete Technologien
### Client
* [IndexedDB](http://www.w3.org/TR/IndexedDB/) (Datenbank)
* [db.js](http://aaronpowell.github.io/db.js/) (Wrapper für IndexedDB)
* [ember.js](http://emberjs.com/) (Framework)
* [socket.io](http://socket.io/) (Server-Verbindung)

### Server
* [node.js](http://nodejs.org/) (Server)
* [MongoDB](https://www.mongodb.org/) (Datenbank)
* [mongoose](http://mongoosejs.com/) (Wrapper für MongoDB)
* [socket.io](http://socket.io/) (Server-Verbindung)

## Funktionsweise
Die Anwendung wird zunächst CRUD-Applikation erstellt (Create, Read, Update, Delete). Jedes in der Anwendung vorkommende Objekt ist komplett über eine Oberfläche verwaltbar.
Später werden diese erstellten Grundfunktionen dazu verwendet Leistungstest auf die Anwednung/Datenbank durchzuführen, es werden über einen seperaten Teil der Anwendung mehrere Objekte auf einmal modifiziert und die Performance dabei bestimmt.
