'use strict';

/**
 * Набір модульних перевірок (Unit Assertions) без побічних ефектів на DOM
 */
function runUnitTests() {
  // 1. Тестування функції validateInput()
  const validResult = validateInput('Архітектура дизайн-систем');
  console.assert(
    validResult.valid === true && validResult.error === '',
    'Test 1.1 Failed: Коректний рядок має проходити валідацію'
  );

  const emptyResult = validateInput('');
  console.assert(
    emptyResult.valid === false,
    'Test 1.2 Failed: Порожній рядок має відхилятися валідацією'
  );

  const spacesOnlyResult = validateInput('     ');
  console.assert(
    spacesOnlyResult.valid === false,
    'Test 1.3 Failed: Рядок лише з пробілів має відхилятися валідацією'
  );

  const invalidTypeResult = validateInput(null);
  console.assert(
    invalidTypeResult.valid === false,
    'Test 1.4 Failed: Некоректний тип даних (null) має відхилятися'
  );

  const overflowResult = validateInput('A'.repeat(301), 300);
  console.assert(
    overflowResult.valid === false,
    'Test 1.5 Failed: Рядок понад 300 символів має відхилятися'
  );

  // 2. Тестування функції isValidState()
  console.assert(
    isValidState('loading') === true &&
      isValidState('content') === true &&
      isValidState('empty') === true &&
      isValidState('error') === true,
    'Test 2.1 Failed: Усі 4 базові стани екрана повинні вважатися валідними'
  );

  console.assert(
    isValidState('unknown') === false && isValidState(123) === false,
    'Test 2.2 Failed: Неіснуючий стан або число мають повертати false'
  );

  // 3. Тестування чистої функції filterModules()
  const mockItems = [
    { title: 'CSS Architecture', category: 'Frontend', description: 'Tokens' },
    { title: 'QA Testing', category: 'Security', description: 'XSS protection' }
  ];

  const foundItems = filterModules(mockItems, '  css ');
  console.assert(
    foundItems.length === 1 && foundItems[0].title === 'CSS Architecture',
    'Test 3.1 Failed: Пошук має працювати без урахування регістру та крайніх пробілів'
  );

  const emptySearch = filterModules(mockItems, 'nonexistent');
  console.assert(
    emptySearch.length === 0,
    'Test 3.2 Failed: Неіснуючий запит має повертати порожній масив'
  );

  console.info('[Unit Tests] Усі перевірки console.assert() успішно завершено.');
}

runUnitTests();