# Traningsdaten-Synchronisation

Eine Applikation, die clientseitig die Daten in einer IndexedDB-Datenbank speichert und sich bei Online-Verbindung mit einem Server mit MongoDB synchronisiert.

## Informationen

Diese Anwendung entsteht im Rahmen einer Bachelorarbeit mit dem Thema *Eine Fallstudie zu leistungsbestimmenden Merkmalen browser-basierter Datenbanken*.

## Verwendete Technologien
### Client
* [IndexedDB](http://www.w3.org/TR/IndexedDB/) (Datenbank)
* [db.js](http://aaronpowell.github.io/db.js/) (Wrapper f�r IndexedDB)
* [socket.io](http://socket.io/) (Server-Verbindung)

### Server
* [node.js](http://nodejs.org/) (Server)
* [MongoDB](https://www.mongodb.org/) (Datenbank)
* [mongoose](http://mongoosejs.com/) (Wrapper für MongoDB)
* [socket.io](http://socket.io/) (Server-Verbindung)

## Zusammenfassung
Die aktuellen Webtechnologien erm�glichen das Erstellen von immer komplexeren Webanwendungen. Diese Webapplikationen verarbeiten meist eine Vielzahl von Datens�tzen und speichern diese persistent in einer Datenbank auf Server-Seite. Dabei besteht jedoch der Bedarf nach einer M�glichkeit diese Applikationen auch offline nutzen zu k�nnen. Somit m�ssen diese Datens�tze offline in einer Datenbank vorgehalten werden.

Im Rahmen dieser Arbeit werden die in den Browser zu Verf�gung gestellten M�glichkeiten evaluiert und hinsichtlich ihrer Einsetzbarkeit untersucht. Abschlie�end wird die Technologie IndexedDB, eine im Browser integrierte Datenbank, hinsichtlich ihrer Leistungsf�higkeit untersucht. Dabei wird mit Hilfe einer Fallstudie versucht die jeweiligen Leistungsgrenzen in den aktuellen Browsern und herauszuarbeiten.