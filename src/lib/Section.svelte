<script lang="ts">
  import Button, { Group, Label } from '@smui/button';
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { TextfieldComponentDev } from '@smui/textfield';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import type { Section } from './api/api';
  import { mapKeyToEntities } from './store/entities';

  const sections = mapKeyToEntities.sections;

  export let id: Section['id'];
  export let editId: Section['id'] = NaN;

  let titleInput: TextfieldComponentDev;
  let title = '';
  let body = '';

  $: section = $sections[id];
  $: isEdit = editId === id;

  function toggleEdit() {
    if (isEdit) {
      editId = NaN;
      return;
    }

    title = section?.title ?? '';
    body = section?.body ?? '';
    editId = id;
  }

  function validate() {
    const trimedTitle = title.trim();

    if (!trimedTitle) {
      titleInput.focus();
      return;
    }

    return {
      title: trimedTitle,
      body: body.trim(),
    };
  }

  function update() {
    const body = validate();
    if (!body) {
      return;
    }
  }
</script>

<div class="placeholder">
  <Paper>
    {#if isEdit}
      <Content>
        <Textfield
          bind:this={titleInput}
          bind:value={title}
          required
          label="Title"
        >
          <HelperText validationMsg slot="helper">
            타이틀을 올바르게 입력해주세요.
          </HelperText>
        </Textfield>

        <Textfield textarea bind:value={body} label="Description">
          <HelperText slot="helper">섹션 설명</HelperText>
        </Textfield>

        <Group variant="unelevated">
          <Button on:click={toggleEdit} color="secondary">
            <Label>취소</Label>
          </Button>
          <Button on:click={update}>
            <Label>완료</Label>
          </Button>
        </Group>
      </Content>
    {:else}
      <Title>{section.title}</Title>
      <Subtitle>{section.body}</Subtitle>
      <Content>
        <Button on:click={toggleEdit}>
          <Label>수정</Label>
        </Button>
      </Content>
    {/if}
  </Paper>
</div>

<style>
  .placeholder {
    margin-right: 16px;
  }
</style>
