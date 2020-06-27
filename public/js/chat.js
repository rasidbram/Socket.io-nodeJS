const socket = io();

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')

// tepmlates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight= $messages.scrollHeight

    // how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop= $messages.scrollHeight
    }
}
// listen to the event
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        shownUserName: message.username,
        createdAtTime: moment(message.createdAt).format('h:mm a'),
        shownMessage: message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

socket.on('locationMessage', (link) => {
    console.log(link)
    const html = Mustache.render(locationMessageTemplate, {
        shownUserName: link.username,
        shownUrl: link.url,
        createdAtTime: moment(link.createdAt).format('h:mm a'),
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users })

    document.querySelector('#sidebar').innerHTML = html
})
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');
    // disable
    const msg = e.target.elements.inputMessage.value

    // emit an event to the socket
    socket.emit('sendMessage', msg, (err) => {

        $messageFormButton.removeAttribute('disabled');
        // to clear input for rewriting and continue focusing
        $messageFormInput.value = ''
        $messageFormInput.focus()

        // enable
        if (err) {
            return console.log(err)
        }

        console.log('Message delivered!!')
    })
})

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    // to get local position
    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude

        }, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location was shared!!');
        });
    });

});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})





// // listen to the event
// socket.on('countUpdated',(count)=>{
//     console.log('the count has been updated',count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('clicked')

//     // emit an event to the socket
//     socket.emit('increment')
// })