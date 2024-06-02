// ==UserScript==
// @name         KhanTrash
// @version      1.0
// @description  te da as questions de mat very ez poha
// @author       HT$
// @match        https://pt.khanacademy.org/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    let loaded = false;

    class Answer {
        constructor(body, type) {
            this.body = body;
            this.type = type;
        }

        get isMultiChoice() {
            return this.type === "multiple_choice";
        }

        get isFreeResponse() {
            return this.type === "free_response";
        }

        get isExpression() {
            return this.type === "expression";
        }

        get isDropdown() {
            return this.type === "dropdown";
        }

        log() {
            const style = "color: green; -webkit-text-stroke: .5px black; font-size:24px; font-weight:bold;";
            const text = this.body.filter(ans => typeof ans === "string").join("\n").replaceAll("$", "");
            if (text) {
                console.log(`%c${text.trim()} `, style);
            }
        }
    }

    const originalFetch = window.fetch;
    window.fetch = async function () {
        try {
            const res = await originalFetch.apply(this, arguments);
            if (res.url.includes("/getAssessmentItem")) {
                const clone = res.clone();
                const json = await clone.json();

                let item, question;

                try {
                    item = json.data.assessmentItem.item.itemData;
                    question = JSON.parse(item).question;
                } catch (error) {
                    throw new Error("Falha ao analisar os dados da questão");
                }

                if (!question) return;

                Object.values(question.widgets).forEach(widget => {
                    const type = widget.type.split(" ")[0];
                    switch (type) {
                        case "numeric-input":
                            freeResponseAnswerFrom(widget).log();
                            break;
                        case "radio":
                            multipleChoiceAnswerFrom(widget).log();
                            break;
                        case "expression":
                            expressionAnswerFrom(widget).log();
                            break;
                        case "dropdown":
                            dropdownAnswerFrom(widget).log();
                            break;
                    }
                });
            }

            if (!loaded) {
                console.clear();
                console.log("%cKhanTrash v1.0", "color: green; -webkit-text-stroke: .5px black; font-size:40px; font-weight:bolder; padding: .2rem;");
                console.log("%cby HT$!", "color: white; -webkit-text-stroke: .5px black; font-size:15px; font-weight:bold;");
                loaded = true;
            }

            return res;
        } catch (error) {
            console.error("Ocorreu um erro:", error);
            throw error;
        }
    }

    function multipleChoiceAnswerFrom(widget) {
        const answer = widget.options?.choices?.filter(choice => choice.correct)?.map(choice => choice.content) || [];
        return new Answer(answer, "multiple_choice");
    }

    function freeResponseAnswerFrom(widget) {
        const answer = widget.options?.answers?.filter(answer => answer.status === "correct")?.map(answer => answer.value) || [];
        return new Answer(answer, "free_response");
    }

    function expressionAnswerFrom(widget) {
        const answer = widget.options?.answerForms?.filter(answer => Object.values(answer).includes("correct"))?.map(answer => answer.value) || [];
        return new Answer(answer, "expression");
    }

    function dropdownAnswerFrom(widget) {
        const answer = widget.options?.choices?.filter(choice => choice.correct)?.map(choice => choice.content) || [];
        return new Answer(answer, "dropdown");
    }
})();
