# instabot

Bots  for instagram

* How to use
  * run `npm install`
  * add your userame and password in index.js
  * run `node index.js`

* What it does?
  * likes the posts
  * follows new people from suggestions
  * starts unfollowing people when you have followed more tha 5000 accounts

* GUI Dashboard with pm2
  * install pm2 in your server <https://github.com/Unitech/pm2>
  * start the  application using `pm2 start index.js`
  * install pm2-gui <https://github.com/lijnam/pm2-gui>
  * Edit the pm2-gui/pm2-gui.ini file or copy the config example to /etc/pm2-gui.ini
  * start the GUI with `pm2-gui start /etc/pm2-gui.ini`

 ![screenshot1](https://i.ibb.co/9tjC4ns/Untitled.png")
 
 ![screenshot2](https://i.ibb.co/XSH3936/Untitled.png)
 
