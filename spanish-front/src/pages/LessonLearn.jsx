import { useContext, useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { Card } from "primereact/card";

//theme
import "primereact/resources/themes/lara-light-indigo/theme.css";

//core
import "primereact/resources/primereact.min.css";
import { Dialog } from "primereact/dialog"; // Импортируем компонент для модального окна

//icons
import "primeicons/primeicons.css";

import { observer } from "mobx-react-lite";
import "../styles/common.css";
import "../styles/lesson-learn-page.css";

import { Toast } from "primereact/toast";
import { NOT_FOUND } from "../utils/statuses";

import { Context } from "..";
import { LearningMode } from "../utils/learn-settings";
import { REGEXES } from "../utils/regexes";

import * as statisticsApi from "../api-requests/statistics-api";
import * as grammarProgressApi from "../api-requests/grammar-progress-api";
import * as topicApi from "../api-requests/topic-api";
import { INVALID_INPUT, OLD_DATA } from "../utils/error-messages";
import {getDeepinfraEmbeddings} from "../api-requests/topic-api";

const LessonLearn = observer(() => {
  const { userSettings } = useContext(Context);
  const toast = useRef(null);

  const showSuccess = (message, summary, life) => {
    toast.current.show({
      severity: "success",
      summary: summary || "Успешно",
      detail: message,
      life: life || 3000,
    });
  };

  const showError = (message, summary, life) => {
    toast.current.show({
      severity: "error",
      summary: summary || "Ошибка",
      detail:
        message || "Вы ввели неверные данные или данные на странице устарели",
      life: life || 3000,
    });
  };
  const [deepinfraVisible, setDeepinfraVisible] = useState(false); // Состояние видимости окна
  const [deepinfraResponse, setDeepinfraResponse] = useState(""); // Ответ от Deepinfra

  const [lessons, setLessons] = useState(null);
  const [lessonFilters, setLessonFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [lessonFilterValue, setLessonFilterValue] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [tasks, setTasks] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentTaskAnswer, setCurrentTaskAnswer] = useState(null);
  const [currentTaskFinishedAnswer, setCurrentTaskFinishedAnswer] = useState(
    []
  );
  const [complitedTasks, setComplitedTasks] = useState([]);

  const [currentTaskCount, setCurrentTaskCount] = useState({
    finished: 0,
    all: 0,
    correct: 0,
  });

  useEffect(() => {
    loadData();
    initFilters();
  }, []);



  const changeCurrentTask = async () => {
    setCurrentTaskAnswer(null);
    setCurrentTaskFinishedAnswer([]);

    const _tasks = [...tasks];

    try {
      if (_tasks.length === 0) {
        showSuccess(
          "Задания в уроке закончились. Выберите другой урок!",
          "Завершёно",
          3000
        );

        setCurrentTask(null);
        setSelectedLesson(null);

        return;
      }
    } catch (error) {
      if (error?.response?.status === NOT_FOUND) {
        await loadData();
        showError(OLD_DATA);
      } else {
        showError(INVALID_INPUT);
      }
    }

    let _currentTask = _tasks.shift();

    switch (userSettings.getLearningModeTasks()) {
      case LearningMode.TRANSLATE_FROM_ENGLISH:
        _currentTask = {
          id: _currentTask.id,
          mainSentence: _currentTask.russianSentence,
          translateSentence: _currentTask.englishSentence,
        };
        break;

      case LearningMode.TRANSLATE_FROM_RUSSIAN:
        _currentTask = {
          id: _currentTask.id,
          mainSentence: _currentTask.russianSentence,
          translateSentence: _currentTask.englishSentence,
        };
        break;

      case LearningMode.COMBINED:
        if (Math.random() < 0.5 ? 0 : 1) {
          _currentTask = {
            id: _currentTask.id,
            mainSentence: _currentTask.russianSentence,
            translateSentence: _currentTask.englishSentence,
          };
        } else {
          _currentTask = {
            id: _currentTask.id,
            mainSentence: _currentTask.englishSentence,
            translateSentence: _currentTask.russianSentence,
          };
        }
        break;

      default:
        break;
    }

    setCurrentTask(_currentTask);
    setCurrentTaskAnswer(
      _currentTask.translateSentence
        .split(REGEXES.PUNCTUATION_MARKS)
        .sort(() => Math.random() - 0.5)
        .filter(Boolean)
    );

  };

  useEffect(() => {
    if (tasks === null) {
      return;
    }

    changeCurrentTask();
  }, [tasks]);

  const loadData = async () => {
    try {
      const _topics = await topicApi.getAllTopics();
      const _grammarProgress = await grammarProgressApi.getAllByUserId();
      const _lessons = lessonTransform(_topics);

      console.log(_grammarProgress);

      setComplitedTasks(_grammarProgress);
      setLessons(_lessons);
      setTasks(null);
      setSelectedLesson(null);

    } catch (error) {}
  };

  const lessonTransform = (_topics) => {
    const _lessons = [];

    _topics.forEach((topic) => {
      if (topic.lessons.length > 0) {
        topic.lessons.forEach((lesson) => {
          _lessons.push({ ...lesson, topicName: topic.name });
        });
      } else {
        _lessons.push({ topicName: topic.name });
      }
    });

    return _lessons;
  };

  const initFilters = () => {
    setLessonFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setLessonFilterValue("");
  };

  const renderHeader = (filterValue, filterChange, tableName) => {
    return (
      <div className="table-header">
        <span className="text-xl text-900 font-bold">{tableName}</span>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={filterValue}
            onChange={filterChange}
            placeholder="Keyword Search"
          />
        </span>
      </div>
    );
  };

  const selectLesson = (e) => {
    setSelectedLesson(e.value);
    const _lesson = lessons.find((item) => item.id === e.value.id);
    setTasks(_lesson.tasks.sort(() => Math.random() - 0.5));
    setCurrentTaskCount({
      finished: 0,
      all: _lesson.tasks.length,
      correct: 0,
    });
  };

  const lessonFilterChange = (e) => {
    const value = e.target.value;
    const _lessonFilters = { ...lessonFilters };

    _lessonFilters["global"].value = value;

    setLessonFilters(_lessonFilters);
    setLessonFilterValue(value);
  };

  const lessonHeader = renderHeader(
    lessonFilterValue,
    lessonFilterChange,
    "Уроки"
  );

  const checkAnswer = async (finishedAnswer) => {
    setCurrentTaskCount((prev) => ({ ...prev, finished: prev.finished + 1 }));

    try {
      const correctAnswer = currentTask.translateSentence
          .replaceAll('ё', 'е') // Заменяем все буквы "ё" на "е"
          .split(REGEXES.PUNCTUATION_MARKS)
          .filter(Boolean)
          .join()
          .toLowerCase(); // Преобразуем к нижнему регистру для сравнения без учёта регистра
      const formattedFinishedAnswer = finishedAnswer
          .replaceAll('ё', 'е') // Заменяем все буквы "ё" на "е"
          .split(" ") // Разделяем слова по пробелу
          .filter(Boolean) // Убираем пустые элементы
          .join(",") // Объединяем слова запятой, как предложено
          .toLowerCase(); // Преобразуем к нижнему регистру для сравнения без учёта регистра
      console.log(correctAnswer);
      console.log(formattedFinishedAnswer);

      if (correctAnswer == formattedFinishedAnswer) {
        await statisticsApi.createOrUpdateStatistics({ tasks: 1 });
        await grammarProgressApi.createGrammarProgress({
          taskId: currentTask.id,
        });
        setCurrentTaskCount((prev) => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        showError(
            `Правильно: ${currentTask.mainSentence} - ${currentTask.translateSentence}. А вы ввели: ${finishedAnswer}`,
            "Ответ неверный :("
        );
      }

      const _tasks = [...tasks];
      _tasks.shift();
      setTasks(_tasks);
    } catch (error) {
      if (error?.response?.status === NOT_FOUND) {
        await loadData();
        showError(OLD_DATA);
      } else {
        console.error(error); // Чтобы увидеть полный вывод ошибки
        showError(INVALID_INPUT);
      }
    }
  };


  const answerSentenceHandler = (wordIndex) => {
    const _currentTaskFinishedAnswer = [...currentTaskFinishedAnswer];
    const _currentTaskAnswer = [...currentTaskAnswer];

    _currentTaskFinishedAnswer.push(_currentTaskAnswer.splice(wordIndex, 1)[0]);

    if (_currentTaskAnswer.length === 0) {
      checkAnswer(_currentTaskFinishedAnswer.join().toUpperCase());
    } else {
      setCurrentTaskAnswer(_currentTaskAnswer);
      setCurrentTaskFinishedAnswer(_currentTaskFinishedAnswer);
    }
  };

  const answerCancelSentenceHandler = (wordIndex) => {
    const _currentTaskFinishedAnswer = [...currentTaskFinishedAnswer];
    const _currentTaskAnswer = [...currentTaskAnswer];

    _currentTaskAnswer.push(_currentTaskFinishedAnswer.splice(wordIndex, 1)[0]);
    setCurrentTaskAnswer(_currentTaskAnswer);
    setCurrentTaskFinishedAnswer(_currentTaskFinishedAnswer);
  };

  const headerTemplate = (data) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-bold">{data.topicName}</span>
      </div>
    );
  };

  const [expandedRows, setExpandedRows] = useState();

  // speech

  const [recordedText, setRecordedText] = useState();
  const [isListening, setIsListening] = useState(false); // Добавлено состояние для отслеживания процесса распознавания

  const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  // Обработка результата распознавания
  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    const modifiedSpeech =
        speechToText.replaceAll("ё", "е").charAt(0).toUpperCase() +
        speechToText.slice(1);
    setRecordedText(modifiedSpeech);
  };

// Установка языка на основе текущего задания
  if (currentTask) {
    if (!/[а-яА-ЯЁё]/.test(currentTask.translateSentence)) {
      recognition.lang = "es-US";
    } else {
      recognition.lang = "ru-RU";
    }
  }


  useEffect(() => {
    if (!currentTask) return;

    // Проверяем язык текущего задания
    const lang = checkLang(currentTask.translateSentence);
    console.log(recognition.lang);

    // Очищаем записанный текст при изменении задания
    setRecordedText("");
  }, [currentTask]);
// Функция запуска/остановки распознавания
  const toggleRecognition = () => {
    if (isListening) {
      recognition.stop(); // Останавливаем процесс распознавания
      setIsListening(false); // Обновляем состояние
    } else {
      recognition.start(); // Запускаем процесс распознавания
      setIsListening(true); // Обновляем состояние
    }
  };
// Проверка языка текста
  const checkLang = (text) => {
    console.log(text);

    const russianLetters = /[а-яА-ЯЁё]/;
    if (russianLetters.test(text)) {
      return "ru-RU"; // Если есть русские буквы, выбираем русский язык
    } else {
      return "es-US"; // Если нет русских букв, выбираем испанский язык
    }
  };
  const askDeepinfra = async () => {
    if (!currentTask) {
      showError("Выберите задание перед использованием этой функции.");
      return;
    }

    try {
      // Определяем целевой язык перевода
      const targetLanguage = currentTask.language === 'ru' ? 'ru' : 'es'; // на русский или испанский

      // Отправляем запрос для перевода текста
      const response = await topicApi.getDeepinfraTextTranslation(currentTask.mainSentence, currentTask.translateSentence, targetLanguage);

      // Форматируем ответ с пояснениями
      const explanation = formatExplanation(response.explanation);

      // Отображаем результат перевода и пояснение
      setDeepinfraResponse(explanation);
      setDeepinfraVisible(true);
    } catch (error) {
      console.error("Ошибка при запросе к Deepinfra API:", error);
      showError("Не удалось получить ответ от Deepinfra.");
    }
  };

// Функция для форматирования объяснения
  const formatExplanation = (text) => {
    return text
        .replace(/\n/g, "<br />") // Заменяем новые строки на <br /> для перевода на новую строку
        .replace(/\d+\./g, (match) => `<strong>${match}</strong>`) // Выделяем номер пункта жирным
        .replace(/([а-яА-Яa-zA-Z]+)\s\(/g, "<strong>$1</strong> ("); // Добавляем выделение к словам перед скобками
  };

  return (
    <div className="lesson-learn-container">
      <Toast ref={toast} />
      <div className="lesson-learn__fields">
        <DataTable
          className="card"
          value={lessons}
          editMode="row"
          dataKey="id"
          filters={lessonFilters}
          header={lessonHeader}
          globalFilterFields={["name"]}
          sortOrder={1}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          selectionMode="single"
          selection={selectedLesson}
          onSelectionChange={selectLesson}
          metaKeySelection={true}
          rowGroupMode="subheader"
          groupRowsBy="topicName"
          rowGroupHeaderTemplate={headerTemplate}
          expandableRowGroups
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
        >
          <Column field="name" header="название" sortable filterField="name" />
        </DataTable>
        <div className="lesson-learn__task-fields">
          <Card
            title={
              currentTask
                ? "Переведите предложение, расставляя слова в нужном порядке или используйте голосовой ввод"
                : "Выберите урок"
            }
            subTitle={
              <div>
                {currentTask && (
                  <div>
                    {complitedTasks.find((item) =>
                      item.taskIds.includes(currentTask.id)
                    )
                      ? "Вы уже выполняли это задание верно"
                      : "Вы ещё не выполняли это задание верно"}
                  </div>
                )}
                <br />
                {currentTask
                  ? `Сейчас выполнено заданий: ${currentTaskCount.finished}/${currentTaskCount.all}. Из них верно: ${currentTaskCount.correct}`
                  : ""}
              </div>
            }
          >

            {currentTask && <p className="m-0">{currentTask.mainSentence}</p>}

            <div className="lesson-learn__answer-finished">
              {currentTaskFinishedAnswer &&
                currentTaskFinishedAnswer.map((word, i) => (
                  <Button
                    className="answer-word"
                    key={i}
                    label={word}
                    onClick={() => answerCancelSentenceHandler(i)}
                    outlined
                  />
                ))}
            </div>
            <div className="lesson-learn__answer">
              {currentTaskAnswer &&
                currentTaskAnswer.map((word, i) => (
                  <Button
                    className="answer-word"
                    key={i}
                    label={word}
                    onClick={() => answerSentenceHandler(i)}
                    outlined
                  />
                ))}
            </div>
            {currentTask && (
                <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 20,
                      gap: 10,
                    }}
                >
                  <Button
                      icon={isListening ? "pi pi-stop" : "pi pi-microphone"} // Меняем иконку в зависимости от состояния
                      rounded
                      text
                      onClick={toggleRecognition} // Используем функцию переключения
                  />
                  <Button rounded onClick={() => checkAnswer(recordedText)}>
                    Применить результат
                  </Button>
                  <p className="m-0">Результат: </p>
                  <p className="m-0">{recordedText}</p>
                  {currentTask && (
                      <div style={{ marginTop: 20 }}>
                        <Button
                            label="Спросить"
                            icon="pi pi-question-circle"
                            onClick={askDeepinfra}
                            className="p-button-help"
                        />
                      </div>
                  )}
                </div>
            )}
          </Card>
        </div>
        <Dialog
            header="Помощь от Deepinfra"
            visible={deepinfraVisible}
            style={{width: "50vw"}}
            onHide={() => setDeepinfraVisible(false)}
        >
          <p>
            <strong>Вопрос:</strong> {currentTask && currentTask.mainSentence}
          </p>
          <p>
            <strong>Ответ:</strong> {currentTask && currentTask.translateSentence}
          </p>
          <p>
            <strong>Объяснение:</strong>
            <div
                dangerouslySetInnerHTML={{
                  __html: deepinfraResponse,
                }}
            />
          </p>
        </Dialog>

      </div>
      <div className="lesson-learn__lesson-theory">
        <Fieldset legend="Теория" toggleable>
          <p className="m-1">{selectedLesson && selectedLesson.theory}</p>
        </Fieldset>
      </div>
    </div>
  );
});

export default LessonLearn;
