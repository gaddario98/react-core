# @gaddario98/react-form

[![npm version](https://badge.fury.io/js/@gaddario98%2Freact-form.svg)](https://badge.fury.io/js/@gaddario98%2Freact-form)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

An advanced React library for managing dynamic and type-safe forms, built on React Hook Form with full support for TypeScript, internationalization, and notifications.

## ✨ Features

- 🎯 **Type-Safe**: Full TypeScript support with generics and automatic type inference
- ⚡ **Performance**: Advanced optimizations with intelligent memoization and React Compiler
- 🌍 **i18n Ready**: Native integration with react-i18next for internationalization
- 🔔 **Notifications**: Built-in notification system for success and error handling
- 🎨 **Customizable**: Fully customizable containers and components
- 📱 **Responsive**: Adaptive layout with header and footer support
- 🔄 **Dynamic**: Dynamic forms with conditional and configurable fields
- 🚀 **React Hook Form**: Built on the powerful React Hook Form library

## 📦 Installation

```bash
npm install @gaddario98/react-form react-hook-form react-i18next i18next
```

### Peer Dependencies

```bash
npm install @gaddario98/react-localization @gaddario98/react-notifications @gaddario98/utiles
```

## 🚀 Quick Start

### Basic Setup

```tsx
import { FormManager, setFormConfig } from '@gaddario98/react-form';
import { useForm } from 'react-hook-form';

// Global configuration (optional)
setFormConfig({
  formFieldContainer: ({ children }) => <div className="field-wrapper">{children}</div>,
  errorTranslationOption: { ns: "form-errors" }
});

// Form types
interface UserForm {
  name: string;
  email: string;
  age: number;
}
```

### Basic Example

```tsx
import React from 'react';
import { FormManager } from '@gaddario98/react-form';
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const formConfig = [
    {
      name: 'name' as const,
      label: 'Name',
      component: ({ value, onChange, error, errorMessage, label }) => (
        <div>
          <label>{label}</label>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderColor: error ? 'red' : 'initial' }}
          />
          {error && <span style={{ color: 'red' }}>{errorMessage}</span>}
        </div>
      ),
      rules: { required: 'Name is required' }
    },
    {
      name: 'email' as const,
      label: 'Email',
      component: ({ value, onChange, error, errorMessage, label }) => (
        <div>
          <label>{label}</label>
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderColor: error ? 'red' : 'initial' }}
          />
          {error && <span style={{ color: 'red' }}>{errorMessage}</span>}
        </div>
      ),
      rules: { 
        required: 'Email is required',
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email'
        }
      }
    }
  ];

  const submitButtons = [
    {
      component: ({ onClick }) => (
        <button onClick={onClick} type="submit">
          Save
        </button>
      ),
      onSuccess: (data: UserForm) => {
        console.log('Form submitted:', data);
        alert('Form saved successfully!');
      },
      onError: (error: Error) => {
        console.error('Form error:', error);
      }
    }
  ];

  return (
    <FormManager<UserForm>
      data={formConfig}
      defaultValues={{ name: '', email: '', age: 0 }}
      submit={submitButtons}
      notification={{
        success: { message: 'Data saved successfully!', type: 'success' },
        error: { message: 'Error saving data', type: 'error' }
      }}
    />
  );
};

export default MyForm;
```

## 📚 API Reference

### FormManager Props

```typescript
interface FormManagerProps<T extends FieldValues> {
  data: Array<FormManagerConfig<T> | ((props: T) => FormManagerConfig<T>)>;
  defaultValues: DefaultValues<T>;
  onInvalid?: SubmitErrorHandler<T>;
  formControl?: UseFormReturn<T>;
  submit?: Submit<T>[];
  notification?: {
    success?: NotificationConfig | ((res: any) => NotificationConfig);
    error?: NotificationConfig | ((error: string) => NotificationConfig);
    ns?: string;
  };
  container?: React.ComponentType<{ children: React.ReactNode }>;
  onValuesChange?: (props: T) => void;
  formSettings?: Omit<UseFormProps<T>, "defaultValues">;
  ns?: string;
  globalErrorNs?: string;
}
```

### FormManagerConfig

```typescript
interface FormManagerConfig<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  component: (props: FieldComponentProps<T>) => React.JSX.Element;
  rules?: RegisterOptions<T>;
  container?: React.FC<PropsWithChildren>;
  ns?: string;
  errorNs?: string;
  index?: number;
  renderInFooter?: boolean;
  renderInHeader?: boolean;
  hidden?: boolean;
  helper?: {
    text?: string;
    translationOption?: TOptions;
  };
  onFieldChange?: (value: PathValue<T, Path<T>>) => void;
}
```

### Submit Configuration

```typescript
interface Submit<T extends FieldValues> {
  onSuccess?: (values: T) => any;
  onError?: (err: Error) => void;
  values?: readonly (keyof T)[];
  component?: (props: {
    onClick: () => void;
    index: number;
    key: string;
    type: "submit";
  }) => React.JSX.Element;
  renderInFooter?: boolean;
  renderInHeader?: boolean;
  hidden?: boolean;
}
```

## 🎨 Advanced Examples

### Dynamic Form with Conditional Fields

```tsx
const DynamicForm = () => {
  const dynamicConfig = [
    {
      name: 'userType' as const,
      label: 'User Type',
      component: ({ value, onChange, label }) => (
        <div>
          <label>{label}</label>
          <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select...</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
      ),
      rules: { required: 'Please select a user type' }
    },
    // Conditional field that appears only for business users
    (formValues: UserForm) => formValues.userType === 'business' ? {
      name: 'companyName' as const,
      label: 'Company Name',
      component: ({ value, onChange, error, errorMessage, label }) => (
        <div>
          <label>{label}</label>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderColor: error ? 'red' : 'initial' }}
          />
          {error && <span style={{ color: 'red' }}>{errorMessage}</span>}
        </div>
      ),
      rules: { required: 'Company name is required for business users' }
    } : { name: 'companyName' as const, hidden: true, component: () => null }
  ];

  return (
    <FormManager<UserForm & { userType: string; companyName?: string }>
      data={dynamicConfig}
      defaultValues={{ name: '', email: '', age: 0, userType: '', companyName: '' }}
      submit={[{
        component: ({ onClick }) => <button onClick={onClick}>Submit</button>,
        onSuccess: (data) => console.log('Dynamic form:', data)
      }]}
    />
  );
};
```

### Partial Submit with Specific Validation

```tsx
const PartialSubmitForm = () => {
  const submitButtons = [
    {
      component: ({ onClick }) => (
        <button onClick={onClick} className="btn-draft">
          Save Draft
        </button>
      ),
      values: ['name'] as const, // Only the name field
      onSuccess: (data: Pick<UserForm, 'name'>) => {
        console.log('Draft saved:', data); // Only { name: string }
      },
      renderInHeader: true
    },
    {
      component: ({ onClick }) => (
        <button onClick={onClick} className="btn-final">
          Submit Final
        </button>
      ),
      // All fields (default)
      onSuccess: (data: UserForm) => {
        console.log('Complete form:', data);
      },
      renderInFooter: true
    }
  ];

  return (
    <FormManager<UserForm>
      data={formConfig}
      defaultValues={{ name: '', email: '', age: 0 }}
      submit={submitButtons}
    />
  );
};
```

### i18n Integration

```tsx
// i18n setup
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      forms: {
        name: 'Name',
        email: 'Email',
        age: 'Age'
      },
      errors: {
        required: 'Field required',
        email: 'Invalid email'
      }
    }
  },
  lng: 'en',
  fallbackLng: 'en'
});

// Form with i18n
const InternationalForm = () => {
  const formConfig = [
    {
      name: 'name' as const,
      label: 'name', // Translation key
      component: ({ value, onChange, error, errorMessage, label }) => (
        <div>
          <label>{label}</label> {/* Automatically translated */}
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <span>{errorMessage}</span>} {/* Translated error */}
        </div>
      ),
      rules: { required: 'required' }, // Translation key
      ns: 'forms' // Namespace for labels
    }
  ];

  return (
    <FormManager<UserForm>
      data={formConfig}
      defaultValues={{ name: '', email: '', age: 0 }}
      ns="forms"
      globalErrorNs="errors"
    />
  );
};
```

### Custom Container and Layout

```tsx
const CustomLayoutForm = () => {
  const CustomContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="custom-form-container">
      <h2>Custom Form</h2>
      <div className="form-grid">
        {children}
      </div>
    </div>
  );

  const CustomFieldContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="field-group">
      {children}
    </div>
  );

  const formConfig = [
    {
      name: 'name' as const,
      label: 'Name',
      component: ({ value, onChange, label }) => (
        <div className="input-wrapper">
          <label className="fancy-label">{label}</label>
          <input
            className="fancy-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ),
      container: CustomFieldContainer,
      index: 1
    }
  ];

  return (
    <FormManager<UserForm>
      data={formConfig}
      defaultValues={{ name: '', email: '', age: 0 }}
      container={CustomContainer}
    />
  );
};
```

## 🔧 Configuration

### Global Setup

```typescript
import { setFormConfig } from '@gaddario98/react-form';

setFormConfig({
  formFieldContainer: ({ children }) => (
    <div className="form-field-wrapper">{children}</div>
  ),
  errorTranslationOption: { 
    ns: "form-errors",
    defaultValue: "Validation error"
  }
});
```

### Custom Hook

```typescript
import { useFormManager } from '@gaddario98/react-form';
import { useForm } from 'react-hook-form';

const useCustomForm = <T extends FieldValues>(config: FormManagerConfig<T>[]) => {
  const formControl = useForm<T>();
  
  const { elements, formContents, errors } = useFormManager({
    data: config,
    formControl,
    submit: [],
    onValuesChange: (values) => {
      console.log('Form values changed:', values);
    }
  });

  return {
    elements,
    formContents,
    errors,
    formControl
  };
};
```

## 🎯 Best Practices

### 1. Correct Typing

```typescript
// ✅ Define specific types
interface UserForm {
  name: string;
  email: string;
  age: number;
}

// ✅ Use as const for field names
const config = [{
  name: 'name' as const, // Type safety
  // ...
}];

// ❌ Avoid any
const badConfig = [{
  name: 'name', // Type inferred as string
  // ...
}];
```

### 2. Memoization

```typescript
// ✅ Memoize complex configurations
const formConfig = useMemo(() => [
  {
    name: 'name' as const,
    component: MyComponent,
    // ...
  }
], []);

// ✅ Memoize handlers
const handleSuccess = useCallback((data: UserForm) => {
  // Handle success
}, []);
```

### 3. Validation

```typescript
// ✅ Detailed validation
const rules = {
  required: 'Field required',
  minLength: {
    value: 3,
    message: 'Minimum 3 characters'
  },
  validate: {
    noSpaces: (value: string) => 
      !value.includes(' ') || 'Spaces not allowed'
  }
};
```

## 🚀 Performance

The library includes several optimizations:

- **Intelligent memoization** with custom comparators
- **React Compiler** for automatic optimizations  
- **Lazy evaluation** for conditional fields
- **Reference stability** to avoid re-renders
- **Selective updates** only for modified fields

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## 🔗 Useful Links

- [React Hook Form Documentation](https://react-hook-form.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support

For support, questions or bug reports, open an [issue](https://github.com/gaddario98/react-form/issues) on GitHub.