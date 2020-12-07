export class EsIndex {
  public health: string | undefined;

  public status: string | undefined;

  public index: string | undefined;

  public uuid: string | undefined;

  public pri: string | undefined;

  public rep: string | undefined;

  public "docs.count": string;

  public "docs.deleted": string;

  public "store.size": string;

  public "pri.store.size": string;
}
