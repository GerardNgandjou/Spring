    // Configuration
    const API_BASE_URL = 'http://localhost:8081/api';
    let currentUser = null;
    let currentToken = localStorage.getItem('token');
    let currentRoom = null;
    let socket = null;
    let rooms = [];

    // DOM Elements
    const tabs = {
        auth: document.getElementById('auth-tab'),
        chat: document.getElementById('chat-tab'),
        users: document.getElementById('users-tab')
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        if (currentToken) {
            validateCurrentToken();
        }
        setupEventListeners();
    });

    function setupEventListeners() {
        // Auto-login on Enter key
        document.getElementById('login-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login(e);
        });
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login(e);
        });
    }

    function switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
        tabs[tabName].classList.add('active');

        // Load data if needed
        if (tabName === 'chat' && currentUser) {
            loadRooms();
        } else if (tabName === 'users' && currentUser) {
            getAllUsers();
        }
    }

    // API Helper Functions
    async function apiCall(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 5000);
    }

    function showSuccess(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 5000);
    }

    // Authentication Functions
    async function register(event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;

        try {
            const response = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, role })
            });

            if (response.success) {
                showSuccess('register-success', 'Registration successful! You can now login.');
                document.getElementById('register-form').reset();
            } else {
                showError('register-error', response.message);
            }
        } catch (error) {
            showError('register-error', error.message);
        }
    }

    async function checkEmail() {
        const email = document.getElementById('register-email').value;
        if (!email) {
            showError('register-error', 'Please enter an email address');
            return;
        }

        try {
            const response = await apiCall(`/auth/check-email?email=${encodeURIComponent(email)}`);

            if (response.success) {
                if (response.data.available) {
                    showSuccess('register-success', 'Email is available!');
                } else {
                    showError('register-error', 'Email already registered');
                }
            }
        } catch (error) {
            showError('register-error', error.message);
        }
    }

    async function login(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success) {
                currentToken = response.data.token;
                localStorage.setItem('token', currentToken);
                currentUser = response.data.user;

                // Update UI
                updateUserInfo();
                showSuccess('login-success', 'Login successful!');
                document.getElementById('login-form').reset();

                // Switch to chat tab
                switchTab('chat');
            } else {
                showError('login-error', response.message);
            }
        } catch (error) {
            showError('login-error', error.message);
        }
    }

    async function validateCurrentToken() {
        try {
            const response = await apiCall('/auth/me');
            if (response.success) {
                currentUser = response.data;
                updateUserInfo();
                loadRooms();
            } else {
                localStorage.removeItem('token');
                currentToken = null;
            }
        } catch (error) {
            localStorage.removeItem('token');
            currentToken = null;
        }
    }

    async function validateToken() {
        if (!currentToken) {
            showError('login-error', 'No token found. Please login first.');
            return;
        }

        try {
            const response = await apiCall('/auth/validate-token', {
                method: 'POST',
                body: JSON.stringify({ token: currentToken })
            });

            if (response.success) {
                showSuccess('login-success', `Token is valid. Expires in: ${response.data.expiresIn} seconds`);
            } else {
                showError('login-error', 'Token is invalid');
            }
        } catch (error) {
            showError('login-error', error.message);
        }
    }

    async function refreshToken() {
        if (!currentToken) {
            showError('login-error', 'No token found. Please login first.');
            return;
        }

        try {
            const response = await apiCall('/auth/refresh-token', {
                method: 'POST'
            });

            if (response.success) {
                currentToken = response.data.token;
                localStorage.setItem('token', currentToken);
                showSuccess('login-success', 'Token refreshed successfully!');
            } else {
                showError('login-error', response.message);
            }
        } catch (error) {
            showError('login-error', error.message);
        }
    }

    async function logout() {
        try {
            await apiCall('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            // Continue with logout even if API call fails
        }

        // Clear local state
        localStorage.removeItem('token');
        currentToken = null;
        currentUser = null;
        currentRoom = null;

        // Close WebSocket connection
        if (socket) {
            socket.close();
            socket = null;
        }

        // Update UI
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        showSuccess('login-success', 'Logged out successfully');
    }

    function updateUserInfo() {
        if (!currentUser) return;

        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('user-role').textContent = `Role: ${currentUser.role}`;
        document.getElementById('user-avatar').textContent = currentUser.email.charAt(0).toUpperCase();

        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('auth-section').classList.add('hidden');
    }

    // Chat Functions
    async function loadRooms() {
        try {
            const response = await apiCall('/chat/rooms');
            rooms = response;
            displayRooms();
        } catch (error) {
            console.error('Failed to load rooms:', error);
            document.getElementById('rooms-list').innerHTML =
                '<div class="error">Failed to load rooms</div>';
        }
    }

    function displayRooms() {
        const container = document.getElementById('rooms-list');
        if (!rooms.length) {
            container.innerHTML = '<div class="loading">No rooms available</div>';
            return;
        }

        container.innerHTML = rooms.map(room => `
            <div class="room-item ${currentRoom?.id === room.id ? 'active' : ''}"
                 onclick="selectRoom(${room.id})">
                <div class="room-name">${room.name}</div>
                <div class="room-meta">
                    <span>${room.type}</span>
                    <span>${room.participantCount} participants</span>
                </div>
            </div>
        `).join('');
    }

    function searchRooms() {
        const searchTerm = document.getElementById('room-search').value.toLowerCase();
        const filteredRooms = rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm)
        );

        const container = document.getElementById('rooms-list');
        container.innerHTML = filteredRooms.map(room => `
            <div class="room-item ${currentRoom?.id === room.id ? 'active' : ''}"
                 onclick="selectRoom(${room.id})">
                <div class="room-name">${room.name}</div>
                <div class="room-meta">
                    <span>${room.type}</span>
                    <span>${room.participantCount} participants</span>
                </div>
            </div>
        `).join('');
    }

    function createRoom() {
        document.getElementById('room-form').classList.remove('hidden');
    }

    function cancelRoom() {
        document.getElementById('room-form').classList.add('hidden');
        document.getElementById('room-name').value = '';
    }

    async function saveRoom() {
        const name = document.getElementById('room-name').value;
        const type = document.getElementById('room-type').value;

        if (!name.trim()) {
            alert('Please enter a room name');
            return;
        }

        try {
            await apiCall('/chat/rooms', {
                method: 'POST',
                body: JSON.stringify({ name, type })
            });

            cancelRoom();
            loadRooms();
            showSuccess('login-success', 'Room created successfully!');
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room');
        }
    }

    async function selectRoom(roomId) {
        try {
            // Get room details
            const room = await apiCall(`/chat/rooms/${roomId}`);
            currentRoom = room;

            // Update UI
            document.getElementById('chat-header').textContent = room.name;
            document.getElementById('message-input').classList.remove('hidden');

            // Load messages
            await loadMessages(roomId);

            // Connect to WebSocket
            connectWebSocket(roomId);

            // Update rooms list
            displayRooms();
        } catch (error) {
            console.error('Failed to select room:', error);
        }
    }

    async function loadMessages(roomId) {
        try {
            const messages = await apiCall(`/chat/rooms/${roomId}/messages`);
            displayMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    function displayMessages(messages) {
        const container = document.getElementById('messages-container');

        if (!messages.length) {
            container.innerHTML = '<div class="loading">No messages yet</div>';
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="message ${message.sender.id === currentUser?.id ? 'own' : ''}">
                <div class="message-header">
                    <span class="message-sender">${message.sender.email}</span>
                    <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${message.content}</div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    function connectWebSocket(roomId) {
        // Close existing connection
        if (socket) {
            socket.close();
        }

        // Create new WebSocket connection
        const wsUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:8080/ws'
            : `wss://${window.location.hostname}/ws`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connected');
            // Join the room
            const joinMessage = {
                type: 'JOIN',
                roomId: roomId,
                userId: currentUser.id
            };
            socket.send(JSON.stringify(joinMessage));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    function handleWebSocketMessage(data) {
        switch (data.type) {
            case 'MESSAGE':
                // Add new message to UI
                const messagesContainer = document.getElementById('messages-container');
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${data.sender.id === currentUser?.id ? 'own' : ''}`;
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${data.sender.email}</span>
                        <span class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-content">${data.content}</div>
                `;
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                break;

            case 'USER_JOINED':
                showSuccess('login-success', `${data.username} joined the room`);
                break;

            case 'USER_TYPING':
                // Update typing indicator
                break;
        }
    }

    async function sendMessage(event) {
        event.preventDefault();

        const messageInput = document.getElementById('message-text');
        const content = messageInput.value.trim();

        if (!content || !currentRoom) return;

        try {
            // Send via WebSocket if connected
            if (socket && socket.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'MESSAGE',
                    content: content,
                    chatRoomId: currentRoom.id,
                    messageType: 'TEXT'
                };
                socket.send(JSON.stringify(message));

                // Also send via REST API for persistence
                await apiCall('/chat/messages', {
                    method: 'POST',
                    body: JSON.stringify({
                        content: content,
                        chatRoomId: currentRoom.id,
                        messageType: 'TEXT'
                    }),
                    headers: {
                        'X-User-Id': currentUser.id
                    }
                });

                messageInput.value = '';
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    // Users Management Functions
    async function getAllUsers() {
        try {
            const response = await apiCall('/users/');
            if (response.success) {
                displayUsers(response.data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            showError('users-error', 'Failed to load users');
        }
    }

    function displayUsers(users) {
        const container = document.getElementById('users-list');

        if (!users.length) {
            container.innerHTML = '<div class="loading">No users found</div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="room-item">
                <div class="room-name">${user.email}</div>
                <div class="room-meta">
                    <span>${user.role}</span>
                    <span>${user.isActive ? 'Active' : 'Inactive'}</span>
                    <span>Joined: ${new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                ${currentUser && currentUser.role === 'ADMIN' && user.id !== currentUser.id ?
                    `<button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">Delete</button>`
                    : ''}
            </div>
        `).join('');
    }

    function searchUsers() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const users = document.querySelectorAll('#users-list .room-item');

        users.forEach(userDiv => {
            const userText = userDiv.textContent.toLowerCase();
            userDiv.style.display = userText.includes(searchTerm) ? 'block' : 'none';
        });
    }

    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await apiCall(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showSuccess('users-success', 'User deleted successfully');
                getAllUsers();
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            showError('users-error', error.message);
        }
    }

    // Utility function for WebSocket message typing
    function sendTypingIndicator(isTyping) {
        if (socket && socket.readyState === WebSocket.OPEN && currentRoom) {
            const typingMessage = {
                type: 'TYPING',
                roomId: currentRoom.id,
                userId: currentUser.id,
                isTyping: isTyping
            };
            socket.send(JSON.stringify(typingMessage));
        }
    }

    // Typing indicator
    let typingTimeout;
    document.getElementById('message-text')?.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        sendTypingIndicator(true);

        typingTimeout = setTimeout(() => {
            sendTypingIndicator(false);
        }, 1000);
    });