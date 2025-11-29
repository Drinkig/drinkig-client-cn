import axios from 'axios';

// Android 에뮬레이터에서는 localhost 대신 10.0.2.2를 사용해야 할 수 있습니다.
// iOS 시뮬레이터에서는 localhost(127.0.0.1)가 잘 작동합니다.
const baseURL = 'http://127.0.0.1:8080';

const client = axios.create({
  baseURL,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;

