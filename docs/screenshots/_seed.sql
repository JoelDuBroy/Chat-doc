UPDATE documents
SET status = 'ready', chunk_count = 3, error_message = NULL, updated_at = NOW()
WHERE id = 'ed2564de-1d48-4004-b17e-513b98da72fb';

DELETE FROM chunks WHERE document_id = 'ed2564de-1d48-4004-b17e-513b98da72fb';

INSERT INTO chunks (id, document_id, content, chunk_index, start_char, end_char, metadata, embedding)
VALUES
(
  gen_random_uuid(),
  'ed2564de-1d48-4004-b17e-513b98da72fb',
  E'Source: harbor-brief.md | Section: Overview | Page 1\n# Harbor Brief\nNorth Harbor Operations needs a clear reading of the winter berthing plan before the board reviews CapEx.',
  0, 0, 120,
  '{"page":1,"section":"Overview"}'::jsonb,
  (SELECT array_agg(0)::vector FROM generate_series(1,384))
),
(
  gen_random_uuid(),
  'ed2564de-1d48-4004-b17e-513b98da72fb',
  E'Source: harbor-brief.md | Section: Berthing | Page 1\n## Berthing windows\nPier 3 stays reserved for refrigerated cargo through February. Night shifts cover tide windows between 22:00 and 04:00.',
  1, 120, 260,
  '{"page":1,"section":"Berthing"}'::jsonb,
  (SELECT array_agg(0)::vector FROM generate_series(1,384))
),
(
  gen_random_uuid(),
  'ed2564de-1d48-4004-b17e-513b98da72fb',
  E'Source: harbor-brief.md | Section: Actions | Page 1\n## Action items\nConfirm crane maintenance by Friday. Share the draft schedule with Harbor Control and Finance.',
  2, 260, 400,
  '{"page":1,"section":"Actions"}'::jsonb,
  (SELECT array_agg(0)::vector FROM generate_series(1,384))
);

SELECT id, status, chunk_count FROM documents WHERE id = 'ed2564de-1d48-4004-b17e-513b98da72fb';
SELECT count(*) AS chunks FROM chunks WHERE document_id = 'ed2564de-1d48-4004-b17e-513b98da72fb';
