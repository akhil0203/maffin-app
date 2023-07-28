import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';
import { mutate } from 'swr';

import { useDataSource } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import Modal from '@/components/Modal';
import type { FormValues } from '@/components/forms/transaction/types';

export type TransactionFormButtonProps = {
  action?: 'add' | 'update' | 'delete',
  defaultValues?: FormValues,
  className?: string,
  children?: React.ReactNode,
};

export default function TransactionFormButton(
  {
    action = 'add',
    defaultValues,
    children,
    className = 'btn-primary',
  }: TransactionFormButtonProps,
): JSX.Element {
  const { save } = useDataSource();
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  let title = 'Add transaction';
  if (action === 'update') {
    title = 'Edit transaction';
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this transaction';
  }

  return (
    <>
      <Modal
        title={title}
        open={isModalOpen}
        setOpen={setIsModalOpen}
      >
        <TransactionForm
          action={action}
          onSave={() => {
            save();
            (defaultValues?.splits || []).forEach(split => mutate(`/api/splits/${split.account.guid}`));
            setIsModalOpen(false);
          }}
          defaultValues={defaultValues}
        />
      </Modal>
      <button
        type="button"
        className={className}
        onClick={() => setIsModalOpen(!isModalOpen)}
      >
        {
          children
          || (
            <>
              <BiPlusCircle className="mr-1" />
              <span>Add Transaction</span>
            </>
          )
        }
      </button>
    </>
  );
}