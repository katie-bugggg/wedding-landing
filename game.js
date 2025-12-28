// Код для Google Apps Script
// Файл: Code.gs

function doPost(e) {
  try {
    // Получаем данные из запроса
    const data = JSON.parse(e.postData.contents);
    
    // Получаем активную таблицу
    const sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID').getActiveSheet();
    
    // Подготавливаем данные для записи
    const rowData = [
      new Date(), // timestamp
      data.name,
      data.guestCount,
      data.additionalGuests || '',
      data.allergies,
      data.drinks,
      data.stayOption,
      data.car,
      data.track,
      data.phone
    ];
    
    // Записываем данные
    sheet.appendRow(rowData);
    
    // Отправляем ответ об успехе
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Данные сохранены' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // В случае ошибки
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Функция для тестирования
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'API is working' }))
    .setMimeType(ContentService.MimeType.JSON);
}
