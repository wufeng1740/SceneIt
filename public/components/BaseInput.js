export default {
  props: {
    modelValue: String,
    id: String,
    label: String,
    type: String,
    required: Boolean,
    error: String,
  },
  methods: {
    handleInput(event) {
      // Emit the value for v-model to work correctly in the parent
      this.$emit('update:modelValue', event.target.value);

      // Emit to clear any existing error message displayed by BaseInput
      this.$emit('update:error', '');

      // Emit the native event object itself for any @input listeners on the <base-input> tag
      // This allows the parent to access event.target.value for things like password strength
      this.$emit('input', event);
    }
  },
  template: `
    <div class="input_fieldset">
      <label :for="id">{{ label }}</label>
      <input
        :id="id"
        class="default-border"
        :type="type"
        :required="required"
        :value="modelValue"
        @input="handleInput"  тивным v-bind="$attrs">
      <p v-if="error" class="input-error">{{ "Error: " + error }}</p>
    </div>
  `,
};