import { faker } from '@faker-js/faker';
import fs from 'fs/promises';

function createRandomUser() {
  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    birthdate: faker.date.birthdate(),
    biography: faker.lorem.paragraph(),
    city: faker.location.city(),
  };
}

const users = [];

console.log('Generating 1,000,000 users...');

for (let i = 0; i < 1_000_000; i++) {
  users.push(createRandomUser());
}

const sqlInitFileText = await fs.readFile('./database-init.template.sql', {
  encoding: 'utf-8',
});

const valuesText = users.map((user, index) => {
  const { first_name, last_name, birthdate, biography, city } = user;

  const insertText = `('${first_name}', '${last_name}', '${birthdate.toISOString()}', '${biography}', '${city}'),`;

  if (index % 100_000 === 0 || index === users.length - 1) {
    console.log(`Processed ${index} users`);
  }

  // The last inserted value should not have comma at the end, instead ; should be used
  if (index === users.length - 1) {
    return insertText.replace('),', ');');
  }

  return insertText
}).join('\n');

console.log('Writing to database-init.sql file...');

await fs.writeFile(
  './database-init.sql',
  sqlInitFileText.replace('$VALUES', valuesText)
);

console.log('Done!');

process.exit(0);
