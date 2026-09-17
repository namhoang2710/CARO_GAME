import { test } from "node:test";
import assert from "node:assert/strict";
import { getRandomQuestion, quizQuestions } from "../src/data/questions";

test("presentation bank has 30 short, easy questions in three balanced sections", () => {
  assert.equal(quizQuestions.length, 30);
  assert.equal(new Set(quizQuestions.map((q) => q.id)).size, 30);
  assert.equal(new Set(quizQuestions.map((q) => q.question)).size, 30);
  for (const topic of ["technology", "role", "vietnam"]) {
    assert.equal(quizQuestions.filter((q) => q.topic === topic).length, 10);
  }
  for (const q of quizQuestions) {
    assert.match(q.id, /^cn4-v2-\d{2}$/);
    assert.equal(q.difficulty, "easy");
    assert.ok(q.question.trim().length > 0 && q.question.length <= 150, q.id);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.every((option) => option.trim().length > 0 && option.length <= 100), q.id);
    assert.ok(Number.isInteger(q.correctAnswerIndex));
    assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length);
    assert.ok(q.explanation.trim().length > 0 && q.explanation.length <= 250, q.id);
  }
});

test("each three draws cover all presentation sections without repeating a question", () => {
  const asked: string[] = [];
  for (let i = 0; i < quizQuestions.length; i++) {
    const q = getRandomQuestion(asked)!;
    assert.ok(q);
    assert.ok(!asked.includes(q.id));
    const original = quizQuestions.find((item) => item.id === q.id)!;
    assert.equal(original.topic, ["technology", "role", "vietnam"][i % 3]);
    asked.push(q.id);
  }
  assert.equal(new Set(asked).size, 30);
  const restarted = getRandomQuestion(asked)!;
  assert.ok(asked.includes(restarted.id));
  assert.equal(quizQuestions.find((q) => q.id === restarted.id)!.topic, "technology");
  // The engine resets asked when an already-seen question is returned.
  const next = getRandomQuestion([restarted.id])!;
  assert.notEqual(next.id, restarted.id);
  assert.equal(quizQuestions.find((q) => q.id === next.id)!.topic, "role");
});

test("legacy, unknown and duplicate IDs do not skew topic balance", () => {
  const first = getRandomQuestion(["q01", "q02", "q03", "unknown"])!;
  assert.equal(quizQuestions.find((q) => q.id === first.id)!.topic, "technology");
  const next = getRandomQuestion([first.id, first.id, "q01", "q45"])!;
  assert.equal(quizQuestions.find((q) => q.id === next.id)!.topic, "role");
  assert.notEqual(next.id, first.id);
});

test("exhausted topics are skipped while other unseen questions remain", () => {
  const asked = quizQuestions.filter((q) => q.topic !== "vietnam").map((q) => q.id);
  for (let i = 0; i < 10; i++) {
    const next = getRandomQuestion(asked)!;
    assert.ok(!asked.includes(next.id));
    assert.equal(quizQuestions.find((q) => q.id === next.id)!.topic, "vietnam");
    asked.push(next.id);
  }
});

test("shuffling preserves the correct answer and never mutates the question bank", (t) => {
  const snapshot = structuredClone(quizQuestions);
  const positions = new Set<number>();
  // Exercise deterministic shuffle paths instead of relying on probabilistic assertions.
  const random = t.mock.method(Math, "random", () => 0);
  for (const value of [0, 0.3, 0.45, 0.99]) {
    random.mock.mockImplementation(() => value);
    for (const original of quizQuestions) {
      const excluded = quizQuestions.filter((q) => q.id !== original.id).map((q) => q.id);
      const shuffled = getRandomQuestion(excluded)!;
      assert.equal(shuffled.id, original.id);
      assert.notEqual(shuffled, original);
      assert.notEqual(shuffled.options, original.options);
      assert.deepEqual([...shuffled.options].sort(), [...original.options].sort());
      assert.equal(shuffled.options[shuffled.correctAnswerIndex], original.options[original.correctAnswerIndex]);
      positions.add(shuffled.correctAnswerIndex);
    }
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
  assert.deepEqual(quizQuestions, snapshot);
});

test("an empty question bank returns null", () => {
  const saved = quizQuestions.splice(0);
  try {
    assert.equal(getRandomQuestion(), null);
  } finally {
    quizQuestions.push(...saved);
  }
});
