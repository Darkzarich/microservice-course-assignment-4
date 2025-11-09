import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const searchData = new SharedArray('search data', function () {
  return JSON.parse(open('./search-data.json'));
});

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const randomUser = searchData[Math.floor(Math.random() * searchData.length)];

  const url = `http://localhost:3000/search?firstName=${randomUser.firstName}&lastName=${randomUser.lastName}`;

  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
