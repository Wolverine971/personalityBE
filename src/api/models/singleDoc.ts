export interface IStoreAllReq {
  title: string;
  index: string;
  section: string;
  url: string;
  rootNode: boolean;
}

export interface ISingleDoc {
  word: string;
  body: {
    title: string;
    date: Date;
    section: string;
    url: string;
    rootNode: boolean;
  };
}

export interface IQuestionHit {
  _index: string;
  _type: string;
  _id: string;
  _score: string;
  _source: {
    question: string;
    authorId: string;
    comments?: number;
    likes?: number;
    subscriptions?: number;
    createdDate: string;
    updatedDate: string;
  };
}
