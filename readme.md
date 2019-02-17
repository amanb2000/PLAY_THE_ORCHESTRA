# Intro and Idea
For our team of First Year UofT Engineering Science students, this was our first Makeathon and first project as a team. We have varying ranges of experience with software and hardware within our team and decided to approach this competition as both a challenge, and a learning experience. 

After a couple hours of brainstorming based on our collective interests, our team arrived on an idea we were all excited about: An interactive orchestra experience to allow players to more easily play together. Jazz ensembles are easily able to improvise together, because they usually play in the same keys. Classical musicians on the other hand, are often not able to predict key changes.    

Our design provides a platform for conductors to change the orchestra in real-time according to their vision. By playing chords on a Midi keyboard, they can “play the orchestra” by transposing and transmitting the chords to the members of the orchestra through the use of wireless connectivity to individual displays powered by Raspberry Pi’s. 

# Planning and Summary
As briefly identified in our introduction, our primary stakeholders for this project are:

Ourselves (a team of first year engineering students attempting their first Makeathon)
Orchestra performers and conductors
MakeUofT Organizers, Sponsors, and Judges

Based on this, we were able to develop some rough objectives to keep us on track for 24 hours: 

To create a unique but achievable product
To improve our software and hardware integration skills
To incorporate sponsor innovations and technologies

To ensure we had something to show after 24 hours, we decided to aim for a minimum viable project (MVP) before adding any bells and whistles. We were able to reach our goals of Midi communication to the serving computer and having note name communication to the player displays. After we reached our MVP, we expanded on our design to have visualization of the notes on the staff, differing transposition options, and automated chord analysis. Finally, we implemented chord suggestion and prediction using Azure Machine Learning.

# Features:
+ Real time note communication between Midi and player displays
+ Visual display of notes on staff
+ Automated Chord Analysis
+ Chord suggestion and predictions using Azure Machine Learning
+ Multiple differently transposed sections available to accommodate a variety of instruments simultaneously 

# Applications:
1. Large group improvisation and composition 
2. Teaching and training
3. Creating new pieces using Azure Machine Learning

# Process 

## Raspberry Pi Setup and Enclosure: 

To act as the receiving devices, we use four Raspberry Pi’s in our project. Each Pi is set up with Raspbian Stretch version 4.14. 

A 7” touch display screen is attached to one of our Pi’s, and monitors to the remaining three. Initially, we were going to use small LCD graphic displays, but ruled these out due to size. A 7” touch display was offered to us to borrow, but to keep our cost down, we opted to use monitors for the remaining Pi’s. Ideally all the Pi’s would have 7” touch display screens, but we decided for a MVP prototype, one was sufficient. 

Beyond our MVP prototype we added a push-button that allows the player to cycle through the available sections (more on sections to follow) on the Raspberry Pi. A simple python script was created to map the GPIO pin connected to the button to a keyboard stroke (the F5 refresh button for web pages). We left room in the box for more features to be added.

We initially hoped to modify the open source PIvena Raspberry Pi enclosure, but after beginning our modifications, we realized laser cutting was not being offered as a service at MakeUofT. Based on limited fabrication lab hours available to us, we opted to design our enclosure out of foamcore. 

The display is set at an angle in order to allow notes to be read easily while playing an instrument. Hardware is located in a box behind the display, making it discrete but easily accessible. 

## Network/IoT Setup:

The Network setup remained simple throughout the project. The basic concept was to have one computer that acted as a master, then any number of displays of all shapes and sizes that could receive instructions from the master and join in on the joys of music. To accomplish this, we used a Node.js framework and wrote predominantly JavaScript to manage the interactivity of different clients. As a result of our objectives, the final product that we have produced is capable of being run on any platform with a web browser, making it highly accessible and scalable. Furthermore, as the result works off of a wireless network, it is capable of accepting a high volume of hosts without added latency, as well as being very easy to connect to. The network setup has been geared towards the IoT model by connecting devices in a collaborative way to enable people to help and support each other in harmony. 

Technically speaking, the socket works using Socket.io, integrating native HTTPS for requests to the Azure Cloud for learned suggestions of chords based on machine intelligence. The socketing breaks the network into a series of sections, which may all operate and play in different keys, requiring transposition for accessible harmony. The number of sections that can be created is theoretically undefined, though for our basic demonstration we make use of four different sections operating in different keys.They are all shown the classic chord data and have available to them the key in which the orchestra is playing giving the player further liberty for experimentation within the piece.

## Machine Learning:

The Azure Machine Learning framework was the center of a feature for the master controller of the project. Provided with historical data of chords played, it would recommend a good follow-up chord to harmonize. Our machine learning algorithm was fed by approximately 3 million data points from pop songs. Though in retrospect we should have trained it with music that finds more standard and less repetitive chords, the concept still worked well enough, though at our hand there was slight underfitting. The structure that worked well for our means was the feeding of 3 points of historical data predicting a fourth point of data to a fair degree of reason. This is a useful feature of our design for those  who would use this concept to collaborate with others or create something new, as it would support them further in a desire for a good, harmonic sound.
